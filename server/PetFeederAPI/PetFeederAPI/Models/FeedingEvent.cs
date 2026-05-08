namespace PetFeederAPI.Models;

public class FeedingEvent
{
    public int Id { get; set; }
    public DateTime FedAt { get; set; }
    public string TriggeredBy { get; set; } = "manual";
}