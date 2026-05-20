namespace PetFeederAPI.Models;

public class ScheduledFeed
{
    public int Id { get; set; }
    public TimeSpan FeedTime { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime? LastTriggeredAt { get; set; }
    public bool? LastTriggerSucceeded { get; set; }
}