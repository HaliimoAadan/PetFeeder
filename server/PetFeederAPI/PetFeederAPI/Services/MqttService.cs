using MQTTnet;
using MQTTnet.Client;
using Microsoft.Extensions.Options;
using PetFeederAPI.Db;
using PetFeederAPI.Interfaces;
using PetFeederAPI.Models;
using PetFeederAPI.Options;

namespace PetFeederAPI.Services;

public class MqttService : IHostedService, IMqttService
{
    private readonly FlespiOptions _flespiOptions;
    private readonly ILogger<MqttService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private IMqttClient _client = null!;
    private MqttClientOptions _options = null!;
    public string FoodLevel { get; private set; } = "unknown";

    public MqttService(IOptions<FlespiOptions> flespiOptions, ILogger<MqttService> logger, IServiceScopeFactory scopeFactory)
    {
        _flespiOptions = flespiOptions.Value;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var factory = new MqttFactory();
        _client = factory.CreateMqttClient();

        _options = new MqttClientOptionsBuilder()
            .WithTcpServer(_flespiOptions.Broker, _flespiOptions.Port)
            .WithCredentials(_flespiOptions.Token, "")
            .WithClientId("PetFeederServer_" + Guid.NewGuid().ToString("N")[..6])
            .WithCleanSession()
            .Build();

        _client.ApplicationMessageReceivedAsync += OnMessageReceived;
        _client.DisconnectedAsync += OnDisconnected;

        await ConnectAsync(cancellationToken);
    }

    private async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _client.ConnectAsync(_options, cancellationToken);
            _logger.LogInformation("Connected to Flespi");

            await _client.SubscribeAsync("petfeeder/fed");
            await _client.SubscribeAsync("petfeeder/food");
            await _client.SubscribeAsync("petfeeder/status");
        }
        catch (Exception ex)
        {
            _logger.LogError("Failed to connect to Flespi: {Message}", ex.Message);
        }
    }

    private async Task OnDisconnected(MqttClientDisconnectedEventArgs e)
    {
        _logger.LogWarning("Disconnected from Flespi. Reconnecting in 5s...");
        await Task.Delay(5000);
        await ConnectAsync();
    }

    private async Task OnMessageReceived(MqttApplicationMessageReceivedEventArgs e)
    {
        var topic = e.ApplicationMessage.Topic;
        var payload = e.ApplicationMessage.ConvertPayloadToString();

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (topic == "petfeeder/fed" && payload == "true")
        {
            db.FeedingEvents.Add(new FeedingEvent { FedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
            _logger.LogInformation("Feeding event saved to database");
        }

        if (topic == "petfeeder/food")
        {
            var previousLevel = FoodLevel;
            FoodLevel = payload;

            if (payload == "low" && previousLevel != "low")
            {
                db.FoodLevelEvents.Add(new FoodLevelEvent
                {
                    RecordedAt = DateTime.UtcNow,
                    Level = payload
                });
                await db.SaveChangesAsync();
                _logger.LogInformation("Food low event saved to database");
            }
        }
    }

    public async Task PublishAsync(string topic, string payload)
    {
        if (!_client.IsConnected)
        {
            _logger.LogWarning("Not connected, attempting reconnect before publish...");
            await ConnectAsync();
        }

        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .Build();

        await _client.PublishAsync(message);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_client.IsConnected)
            await _client.DisconnectAsync();
    }
}