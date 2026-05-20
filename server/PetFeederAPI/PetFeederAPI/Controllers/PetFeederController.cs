using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetFeederAPI.Db;
using PetFeederAPI.Interfaces;

namespace PetFeederAPI.Controllers;

[ApiController]
[Route("api")]
public class PetFeederController : ControllerBase
{
    private readonly IMqttService _mqtt;
    private readonly AppDbContext _db;

    public PetFeederController(IMqttService mqtt, AppDbContext db)
    {
        _mqtt = mqtt;
        _db = db;
    }

    /// <summary>Check if the API is online</summary>
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { status = "online", timestamp = DateTime.UtcNow });
    }

    /// <summary>Send a feed command to the pet feeder</summary>
    [HttpPost("feed")]
    public async Task<IActionResult> Feed()
    {
        await _mqtt.PublishAsync("petfeeder/command", "feed");
        return Ok(new { sent = true, timestamp = DateTime.UtcNow });
    }

    /// <summary>Get the feeding history (last 50 events)</summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var history = await _db.FeedingEvents
            .OrderByDescending(e => e.FedAt)
            .Take(50)
            .ToListAsync();
        return Ok(history);
    }

    /// <summary>Get the current food level</summary>
    [HttpGet("food")]
    public IActionResult GetFoodLevel()
    {
        return Ok(new { level = _mqtt.FoodLevel });
    }
    
    /// <summary>Get the ESP32 connection status</summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new { esp = _mqtt.EspStatus, timestamp = DateTime.UtcNow });
    }
    
    /// <summary>Attempt to reconnect to MQTT broker</summary>
    [HttpPost("reconnect")]
    public async Task<IActionResult> Reconnect()
    {
        await _mqtt.ReconnectAsync();
        await Task.Delay(2000);
        return Ok(new { esp = _mqtt.EspStatus });
    }
}