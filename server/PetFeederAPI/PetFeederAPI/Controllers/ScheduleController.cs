using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetFeederAPI.Db;
using PetFeederAPI.Models;

namespace PetFeederAPI.Controllers;

[ApiController]
[Route("api/schedule")]
public class ScheduleController : ControllerBase
{
    private readonly AppDbContext _db;

    public ScheduleController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Get all scheduled feeds</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var schedules = await _db.ScheduledFeeds
            .OrderBy(s => s.FeedTime)
            .ToListAsync();
        return Ok(schedules);
    }

    /// <summary>Add a new scheduled feed</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScheduleRequest request)
    {
        var schedule = new ScheduledFeed
        {
            FeedTime = TimeSpan.Parse(request.FeedTime),
            IsEnabled = true
        };
        _db.ScheduledFeeds.Add(schedule);
        await _db.SaveChangesAsync();
        return Ok(schedule);
    }

    /// <summary>Toggle enable/disable a schedule</summary>
    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var schedule = await _db.ScheduledFeeds.FindAsync(id);
        if (schedule == null) return NotFound();
        schedule.IsEnabled = !schedule.IsEnabled;
        await _db.SaveChangesAsync();
        return Ok(schedule);
    }

    /// <summary>Delete a scheduled feed</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await _db.ScheduledFeeds.FindAsync(id);
        if (schedule == null) return NotFound();
        _db.ScheduledFeeds.Remove(schedule);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record CreateScheduleRequest(string FeedTime);