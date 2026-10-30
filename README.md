# Kvist & Bjælke ApS


## CDS.Security
### Description of the login platform
### Implementation

## CDS.Infrastructure
### Company devices and assumptions
### IP addressing plan

| VLAN | Name         | Network      | Subnet mask     | Default   | Devices                                      | Addressing |
|------|--------------|--------------|-----------------|-----------|----------------------------------------------|------------|
| 570  | Clients      | 10.5.70.0/24 | 255.255.255.0   | 10.5.70.1 | 15 desktops, 10 laptops, staff wifi          | DHCP       |
| 571  | Servers      | 10.5.71.0/24 | 255.255.255.0   | 10.5.71.1 | 3 servers                                    | static     |
| 572  | VoIP         | 10.5.72.0/26 | 255.255.255.192 | 10.5.72.1 | 12 IP phones                                 | DHCP       |
| 573  | Printers     | 10.5.73.0/28 | 255.255.255.240 | 10.5.73.1 | 3 printers                                   | static     |
| 574  | Surveillance | 10.5.74.0/27 | 255.255.255.224 | 10.5.74.1 | 6 cameras                                    | static     |
| 575  | Guest        | 10.5.75.0/24 | 255.255.255.0   | 10.5.75.1 | Guest phones and laptops, guest wifi         | DHCP       |
| 576  | Management   | 10.5.76.0/27 | 255.255.255.224 | 10.5.76.1 | Switches, router & firewall, 4 access points | static     |
### Subnetting

|                | Printers (VLAN 573)   | Surveillance (VLAN 574) | Client                 |
|----------------|-----------------------|-------------------------|------------------------|
| Network Address| 10.5.73.0             | 10.5.74.0               | 10.5.70.0              |
| Subnet mask    | /28 = 255.255.255.240 | /27 = 255.255.255.224   | /24 = 255.255.255.0    |
| Usable hosts   | 2^4 - 2 = 14          | 2^5 - 2 = 30            | 2^8 - 2 = 254          |
| Devices today  | 3                     | 6                       | 25 (plus wifi devices) |

### Ubuntu server on VLAN 571
### Docker and deployment of the platform
### Client machine on VLAN 570
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
We first drafted the IP addressing plan and the subnetting ourselves. We then used Claude to review our drafts and suggests improvements, and we compared its output with our own. We adopted the extra VLANs and the static vs DHCP allocation, and kept our own choices for the rest that is we made. Claude also helped with the structure of the README, the network diagram draft, and draft explanations of VLANs, routing, and the firewall, which we then adjusted ourselves. Claude was also used as help with the login platform: code optimization, and specifics such as JWT tokens, password hashing with argon2id, and the login system with the three roles. We reviewed and adapted the suggestions before using them. The virtual machines, Docker setup, configuration, testing, and screenshots were done by us. We take responsibility for the whole report.

## Final reflection
