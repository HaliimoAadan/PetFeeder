using Microsoft.EntityFrameworkCore;
using PetFeederAPI.Models;

namespace PetFeederAPI.Db;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<FeedingEvent> FeedingEvents { get; set; }
    public DbSet<FoodLevelEvent> FoodLevelEvents { get; set; }
    public DbSet<ScheduledFeed> ScheduledFeeds { get; set; }
    public DbSet<ScheduledFeedFailure> ScheduledFeedFailures { get; set; }
}