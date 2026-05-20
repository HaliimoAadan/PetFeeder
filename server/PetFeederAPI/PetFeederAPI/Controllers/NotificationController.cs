using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetFeederAPI.Db;

namespace PetFeederAPI.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUnread([FromServices] AppDbContext db)
    {
        var failures = await db.ScheduledFeedFailures
            .Where(f => !f.IsAcknowledged)
            .OrderByDescending(f => f.FailedAt)
            .ToListAsync();
        return Ok(failures);
    }

    [HttpPatch("{id}/acknowledge")]
    public async Task<IActionResult> Acknowledge(int id, [FromServices] AppDbContext db)
    {
        var failure = await db.ScheduledFeedFailures.FindAsync(id);
        if (failure == null) return NotFound();
        failure.IsAcknowledged = true;
        await db.SaveChangesAsync();
        return Ok();
    }
}