namespace PetFeederAPI.Models;

public class ScheduledFeedFailure
{
    public int Id { get; set; }
    public DateTime FailedAt { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsAcknowledged { get; set; }
}