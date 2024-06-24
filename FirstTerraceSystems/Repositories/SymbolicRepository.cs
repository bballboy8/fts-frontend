using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using SQLite;

namespace FirstTerraceSystems.Repositories
{
    internal class SymbolicRepository
    {
        private readonly SQLiteConnection _connection;

        public SymbolicRepository(SQLiteConnection connection)
        {
            _connection = connection;
        }

        public SymbolicData? GetLastRecord()
        {
            return _connection.Table<SymbolicData>().LastOrDefault();
        }

        public IEnumerable<dynamic> GetSymbolicDataBySymbol(string symbol)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol).Select(x => new { t = x.TimeStamp, p = x.Price }).ToList();
            return result;
        }

        public void UpdateSymbolicDataToDB(List<SymbolicData> data)
        {
            List<SymbolicData> batch = [];
            foreach (var item in data)
            {
                var dateTime = item.Date;

                if (long.TryParse(item.TrackingID, out long value))
                {
                    dateTime = dateTime.AddMilliseconds(value / 1000000);
                }

                item.TimeStamp = dateTime.ToString("yyyy-MM-ddTHH:mm:ss.fff");

                // Convert to Eastern Time
                //TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
                //DateTime easternTime = TimeZoneInfo.ConvertTimeFromUtc(dateTime, easternZone);
                //item.TimeStamp = easternTime.ToString("yyyy-MM-ddTHH:mm:ss.fff");

                item.Price = item.Price / 10000;

                batch.Add(item);
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }

            if (batch.Count > 0) _connection.InsertAll(batch);
        }

        public void UpdateSymbolicsocketDataToDB(NasdaqResponse data)
        {
            List<SymbolicData> batch = new();

            foreach (var item in data.Data)
            {
                batch.Add(new SymbolicData(data.Headers, item));
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }

            if (batch.Count > 0) _connection.InsertAll(batch);
        }
    }
}
