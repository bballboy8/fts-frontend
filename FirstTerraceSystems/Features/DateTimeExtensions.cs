namespace FirstTerraceSystems.Features
{
    public static class DateTimeExtensions
    {
        public static DateTime GetPastBusinessDay(this DateTime date, int daysToSubtract)
        {
            DateTime lastBusinessDay = date.AddDays(-daysToSubtract);

            while (true)
            {
                if (lastBusinessDay.DayOfWeek != DayOfWeek.Saturday && lastBusinessDay.DayOfWeek != DayOfWeek.Sunday)
                {
                    if (lastBusinessDay.Day == 1)
                    {
                        // Handle the case when the day is the first of the month
                        lastBusinessDay = new DateTime(lastBusinessDay.Year, lastBusinessDay.Month, 1).AddDays(-1);

                        // Ensure it's not a weekend
                        while (lastBusinessDay.DayOfWeek == DayOfWeek.Saturday || lastBusinessDay.DayOfWeek == DayOfWeek.Sunday)
                        {
                            lastBusinessDay = lastBusinessDay.AddDays(-1);
                        }
                        return lastBusinessDay;
                    }
                    else
                    {
                        return lastBusinessDay;
                    }
                }
                lastBusinessDay = lastBusinessDay.AddDays(-1);
            }
        }
    }
}
