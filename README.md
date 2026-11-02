# Kvist & Bjælke ApS


## CDS.Security
### Description of the login platform

The platform is a web application where users log in with a username and password. There are 3 roles. 

**user**: Can read tables

**superuser**: CRUD users

**admin**: CRUD users, superusers, admins

The system consists of an ASP.NET Core (.NET 10) backend, a PostgreSQL database, and a React frontend built with Bun. The backend is divided into API, Service, and Infrastructure layers to keep the application organised.

ASP.NET Core was chosen because it is the framework used in the course and provides features such as authentication, role management, and rate limiting. React and Bun were also chosen because they are part of the technologies used during the semester. PostgreSQL was selected as the database because it is free, reliable, and allows us to enforce rules such as unique usernames and predefined user roles.

The application uses linq2db and Npgsql to communicate with the database, while Argon2 is used to securely hash user passwords before they are stored.

### Implementation

Authentication and roles

When a user logs in, the server makes a JWT with the user id and the role. It is valid for 30 minutes and is stored in a cookie with HttpOnly (JavaScript can't read it), SameSite=Strict (helps against CSRF) and Secure (only sent over HTTPS). A wrong username and a wrong password give the same 401, so you can't tell which one was wrong. The role is checked on the server on every request. Everyone who is logged in can read users, but only superusers and admins can create, update and delete. A superuser can only change users with the role user, so they can't edit an admin or make someone an admin, and nobody can delete themselves. The database also only allows the three roles.

Passwords and other protection

Passwords are hashed with Argon2id, so only the hash is saved, never the password. We use 64 MiB memory, 3 iterations and 1 thread, which is more than OWASP's minimum. Every password gets its own random salt, and they must be 12-128 characters long. If the username doesn't exist, the server still checks a dummy hash, so the response time doesn't show if the user exists. Logins are also limited to 5 attempts per minute per IP, errors only show a general message, and Swagger is only on in development. The secrets (database connection, JWT key and admin password) are in environment variables or user-secrets, not in git. In Docker they are given as environment variables, like Jwt__Key. The cookie is Secure by default, but our VM uses plain HTTP, so we turn that off there with Jwt__CookieSecure=false.

Alternatives we considered

For hashing we looked at bcrypt, but chose Argon2id because it is memory-hard. We chose JWT over server-side sessions because it is simpler to run in Docker, and a cookie over localStorage because JavaScript can't read an HttpOnly cookie.


## CDS.Infrastructure

### IP addressing plan

VLAN 57N uses 10.5.7N.x. VLAN 572-576 are our own choice. The assignment writes 10.5.71/24 for the servers, and we read that as 10.5.71.0/24. We use .1 as the gateway in every network, but the real gateways have to be checked in the lab.

| VLAN | Name         | Network      | Subnet mask     | Default gateway | Devices                                      | Addressing |
|------|--------------|--------------|-----------------|-----------------|----------------------------------------------|------------|
| 570  | Clients      | 10.5.70.0/24 | 255.255.255.0   | 10.5.70.5       | 15 desktops, 10 laptops, staff wifi          | DHCP       |
| 571  | Servers      | 10.5.71.0/24 | 255.255.255.0   | 10.5.71.5       | 3 servers                                    | static     |
| 572  | VoIP         | 10.5.72.0/26 | 255.255.255.192 | 10.5.72.1       | 12 IP phones                                 | DHCP       |
| 573  | Printers     | 10.5.73.0/28 | 255.255.255.240 | 10.5.73.1       | 3 printers                                   | static     |
| 574  | Surveillance | 10.5.74.0/27 | 255.255.255.224 | 10.5.74.1       | 6 cameras                                    | static     |
| 575  | Guest        | 10.5.75.0/24 | 255.255.255.0   | 10.5.75.1       | Guest phones and laptops, guest wifi         | DHCP       |
| 576  | Management   | 10.5.76.0/27 | 255.255.255.224 | 10.5.76.1       | Switches, router & firewall, 4 access points | static     |


Servers and printers
We split the network into separate VLANs so the servers, which run the login platform, are kept away from the clients and the guests, whoses devices we can't control. The firewall decides who reaches what and guests only get internet. Cameras and printers are a bit more vulnerable therefore having their own networks in case they were hacked. Phones are separate so calls will not be disturbed by traffic, and management network keeps switches and access points away from normal users. Servers, printers, cameras and network get static address so they always exist at the same place. Clients, guests, and phones use DHCP, since they can change and are numerous. Every network is bigger than needed so they can be expanded upon in the future. 

### Subnetting

|                | Printers (VLAN 573)   | Surveillance (VLAN 574) | Client                 |
|----------------|-----------------------|-------------------------|------------------------|
| Network Address| 10.5.73.0             | 10.5.74.0               | 10.5.70.0              |
| Subnet mask    | /28 = 255.255.255.240 | /27 = 255.255.255.224   | /24 = 255.255.255.0    |
| Usable hosts   | 2^4 - 2 = 14          | 2^5 - 2 = 30            | 2^8 - 2 = 254          |
| Devices today  | 3                     | 6                       | 25 (plus wifi devices) |

3 printers and gateway need 4 addresses. A /29 would be enough, but /28 has 14 so there is room for more printers. /27 for the cameras has 30 so plenty more cameras can be added. Clients /24 was given and allows for more than enough for the PCs, phones and wifi. If a network gets too small, it can be expanded without changing the others. 

### Ubuntu server on VLAN 571

| Parameter | Value |
|---|---|
| Operating system | Ubuntu Server 26.04.1 LTS |
| Virtualization | Proxmox (VM 110, KnB) |
| Hostname | knb |
| Network | VLAN 571|
| IP address | 10.5.71.82/24 (assigned by DHCP in the lab) |
| Default gateway | 10.5.71.5 |
| Hosting | Docker container |
| Chosen TCP port | 8080 (within 8000-8100) |

### Docker and deployment of the platform
### Client machine on VLAN 570

| Parameter | Value |
|---|---|
| Operating system | Ubuntu Desktop 26.04 LTS |
| Virtualization | Proxmox |
| Hostname | naja-Standard-PC-i440FX-PIIX-1996 |
| Network | VLAN 570, interface ens18 |
| IP address | 10.5.70.96/24 (assigned by DHCP in the lab) |
| Default gateway | 10.5.70.5 |

### Communication between client and login platform
**Explanation of VLANs, routing and firewall**

**Testing summary**

Server (VLAN 571)

| Requirement                                                |Result|
|------------------------------------------------------------|-|
| Ubuntu Server has been installed                           ||
| The server has the correct IP configuration                ||
| Docker has been installed and is functioning               ||
| The login platform is running inside a docker container    ||
| The login platform is accessible through the selected port ||
Client (VLAN 570)

| Requirement                                                            |Result|
|------------------------------------------------------------------------|-|
| The client has the correct IP configuration                            ||
| The client can access the login platform on VLAN 571                   ||
| The login platform's functionality can be used from the client machine ||

### Challenges and solutions
|Problem|Cause|Solution|



## AI usage disclosure
We first drafted the IP addressing plan and the subnetting ourselves. We then used Claude to review our drafts and suggests improvements, and we compared its output with our own. We adopted the extra VLANs and the static vs DHCP allocation, and kept our own choices for the rest. Claude also helped with the structure of the README, draft explanations of VLANs, routing, and the firewall, which we then adjusted ourselves. Claude was also used as help with the login platform: code optimization, and specifics such as JWT tokens, password hashing with argon2id, and the login system with the three roles. We reviewed and adapted the suggestions before using them. The virtual machines, Docker setup, configuration, testing, and screenshots were done by us. We take responsibility for the whole report.


## Final reflection
