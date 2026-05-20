using Microsoft.EntityFrameworkCore;
using PetFeederAPI.Db;
using PetFeederAPI.Interfaces;
using PetFeederAPI.Models;

namespace PetFeederAPI.Services;

public class FeedSchedulerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<FeedSchedulerService> _logger;
    private readonly IMqttService _mqtt;

    public FeedSchedulerService(IServiceScopeFactory scopeFactory, ILogger<FeedSchedulerService> logger, IMqttService mqtt)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _mqtt = mqtt;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CheckSchedulesAsync();
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task CheckSchedulesAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.Now;
        var currentTime = now.TimeOfDay;

        var schedules = await db.ScheduledFeeds
            .Where(s => s.IsEnabled)
            .ToListAsync();

        foreach (var schedule in schedules)
        {
            var diff = (currentTime - schedule.FeedTime).TotalMinutes;

            var alreadyFiredToday = schedule.LastTriggeredAt.HasValue &&
                                    schedule.LastTriggeredAt.Value.ToLocalTime().Date == now.Date;

            if (diff >= 0 && diff < 1 && !alreadyFiredToday)
            {
                _logger.LogInformation("Scheduled feed triggered at {Time}", schedule.FeedTime);

                if (_mqtt.EspStatus != "online")
                {
                    _logger.LogWarning("Scheduled feed failed — device is offline");
                    db.ScheduledFeedFailures.Add(new ScheduledFeedFailure
                    {
                        FailedAt = DateTime.UtcNow,
                        Reason = "Device was offline at scheduled feed time"
                    });
                    schedule.LastTriggerSucceeded = false;
                }
                else
                {
                    try
                    {
                        await _mqtt.PublishAsync("petfeeder/command", "feed");
                        schedule.LastTriggerSucceeded = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Scheduled feed failed — could not publish command");
                        db.ScheduledFeedFailures.Add(new ScheduledFeedFailure
                        {
                            FailedAt = DateTime.UtcNow,
                            Reason = "Failed to send feed command to device"
                        });
                        schedule.LastTriggerSucceeded = false;
                    }
                }

                schedule.LastTriggeredAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }
        }
    }
}