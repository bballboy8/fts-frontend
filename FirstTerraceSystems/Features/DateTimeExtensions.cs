namespace FirstTerraceSystems.Features
{
    public static class DateTimeExtensions
    {
        public static DateTime GetPastBusinessDay(this DateTime date, int daysToSubtract)
        {
            DateTime lastBusinessDay = date;
            int daysSubtracted = 0;

            while (daysSubtracted < daysToSubtract)
            {
                lastBusinessDay = lastBusinessDay.AddDays(-1);
                if (lastBusinessDay.DayOfWeek != DayOfWeek.Saturday && lastBusinessDay.DayOfWeek != DayOfWeek.Sunday)
                {
                    daysSubtracted++;
                }
            }

            return lastBusinessDay;
        }
    }
}
