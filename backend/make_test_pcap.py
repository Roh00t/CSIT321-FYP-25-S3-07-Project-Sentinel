from scapy.all import IPv6, UDP, DNS, DNSQR, wrpcap
from datetime import datetime

# Packet details matching the test alert
src_ip = "fe80:0000:0000:0000:0000:0000:0000:0001"
dst_ip = "fe80:0000:0000:0000:c429:3a4b:1261:924f"
src_port = 53
dst_port = 53062
timestamp = datetime.strptime("2025-10-21T00:42:50", "%Y-%m-%dT%H:%M:%S").timestamp()

# Create a DNS query packet
pkt = IPv6(src=src_ip, dst=dst_ip)/UDP(sport=src_port, dport=dst_port)/DNS(rd=1,qd=DNSQR(qname="assets.msn.com"))
pkt.time = timestamp

# Write to PCAP
wrpcap("test_match.pcap", [pkt])
print("Test PCAP file 'test_match.pcap' created with one matching packet.")