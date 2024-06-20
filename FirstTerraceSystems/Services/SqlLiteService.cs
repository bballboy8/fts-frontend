using FirstTerraceSystems.Entities.Nasdaq;
using SQLite;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Globalization;
using System.Text.Json.Serialization;

namespace FirstTerraceSystems.Services
{
    public class SqlLiteService
    {
        private SQLiteConnection _connection;

        public SqlLiteService()
        {
            var dbpath = Path.Combine(Environment.ProcessPath.Replace("FirstTerraceSystems.exe",""), "FTS.db");
            //var dbpath = Path.Combine(@"D:\", "FTS.db");
            _connection = new SQLiteConnection(dbpath);
            _connection.CreateTable<SymbolicData>();
        }

        public SymbolicData? GetLastSample()
        {
            var last = _connection.Table<SymbolicData>().LastOrDefault();
            return last;
        }
        public IEnumerable<dynamic> GetSymbolicData(string symbol)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol)
                .Select(x => new { t = x.TimeStamp, p = x.Price }).ToList();
            return result;
        }

        public void UpdateSymbolicDataToDB(List<SymbolicData> data)
        {
            List<SymbolicData> batch = [];
            foreach (var item in data)
            {
                var dt = item.Date;// DateTime.ParseExact(item.Date.ToShortDateString(), "yyyy-MM-dd", CultureInfo.InvariantCulture);
                dt = dt.AddMilliseconds(long.Parse(item.TrackingID) / 1000000);
                item.TimeStamp = dt.ToString("yyyy-MM-ddTHH:mm:ss.fff");
                batch.Add(item);
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }
            if (batch.Count > 0)
                _connection.InsertAll(batch);
        }
    }
}
