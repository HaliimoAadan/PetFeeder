namespace PetFeederAPI.Models;

public class FoodLevelEvent
{
    public int Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public string Level { get; set; } = string.Empty;
}