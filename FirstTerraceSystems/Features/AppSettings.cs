namespace FirstTerraceSystems.Features
{
    public sealed class AppSettings
    {
        //SecureStorage Keys
        public const string SS_AuthToken = "Key_AuthToken";
        public const string SS_AuthEmail = "Key_AuthEmail";
    }

    public sealed class ApiEndpoints
    {
        public const string CloudDataServiceUri = "https://restapi.clouddataservice.nasdaq.com";

        public const string RestAPIUri = "http://52.72.116.51:8000";

        /// <summary>
        /// Base Address "http://52.0.33.126:8000"
        /// </summary>
        public const string WebSocketUri = "ws://52.0.33.126:8000";
        //public const string WebSocketUri = "ws://localhost:6969";
    }
}
