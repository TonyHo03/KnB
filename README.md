# Kvist & Bjælke ApS


## CDS.Security
### Description of the login platform
### Implementation

## CDS.Infrastructure
### Company devices and assumptions
### IP addressing plan
### Subnetting
### Network diagram
### Ubuntu server on VLAN 571
### Docker and deployment of the platform
### Client machine on VLAN 570
### Communication between client and login platform
**Explanation of VLANs, routing and firewall**

**Testing summary**

Server (VLAN 571)

|Requirement|Result|

Client (VLAN 570)

|Requirement|Result|

### Challenges and solutions
|Problem|Cause|Solution|



## AI usage disclosure
We first drafted the IP addressing plan and the subnetting ourselves. We then used Claude to review our drafts and suggests improvements, and we compared its output with our own. We adopted the extra VLANs and the static vs DHCP allocation, and kept our own choices for the rest that is we made. Claude also helped with the structure of the README, the network diagram draft, and draft explanations of VLANs, routing, and the firewall, which we then adjusted ourselves. Claude was also used as help with the login platform: code optimization, and specifics such as JWT tokens, password hashing with argon2id, and the login system with the three roles. We reviewed and adapted the suggestions before using them. The virtual machines, Docker setup, configuration, testing, and screenshots were done by us. We take responsibility for the whole report.

## Final reflection
