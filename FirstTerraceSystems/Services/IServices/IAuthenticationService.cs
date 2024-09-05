using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Services.IServices
{
    public interface IAuthenticationService
    {
        Task<RegisterResponseDto> Registration(RegisterModel model);
        Task<AuthResponse> Login(LoginDto userForAuthentication);
        Task Logout(LoginDto model);
        Task<bool?> ValidateUserEmail(string? email);
    }
}
