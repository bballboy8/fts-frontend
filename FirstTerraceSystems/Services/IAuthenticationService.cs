using FirstTerraceSystems.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Services
{
    public interface IAuthenticationService
    {
        Task<AuthResponseDto> Login(LoginDto userForAuthentication);
        Task Logout(LoginDto model);

    }
}
