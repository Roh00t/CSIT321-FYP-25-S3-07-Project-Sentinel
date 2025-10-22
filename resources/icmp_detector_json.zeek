##! ICMP Detection Script - JSON Output
##! Generates JSON alerts for ICMP traffic with severity 1
##! All other traffic logged with null severity (activity)
##! Compatible with Sentinel alert normalization

@load base/protocols/conn
@load policy/tuning/json-logs.zeek

module ICMPDetector;

export {
    redef enum Log::ID += { LOG };

    type Info: record {
        timestamp: time &log &default=network_time();
        src_ip: addr &log;
        src_port: count &log &optional;
        dest_ip: addr &log;
        dest_port: count &log &optional;
        protocol: string &log;
        signature: string &log;
        severity: count &log &optional;
    };
}

event zeek_init() &priority=5
{
    Log::create_stream(ICMPDetector::LOG, [$columns=Info, $path="icmp_detector"]);
}

event connection_state_remove(c: connection)
{
    local info: Info;
    local proto_name = get_port_transport_proto(c$id$resp_p);
    
    # Convert protocol to string
    local proto_str = "UNKNOWN";
    if (proto_name == tcp)
        proto_str = "TCP";
    else if (proto_name == udp)
        proto_str = "UDP";
    else if (proto_name == icmp)
        proto_str = "ICMP";
    
    # Set timestamp
    info$timestamp = c$start_time;
    
    # Set IPs
    info$src_ip = c$id$orig_h;
    info$dest_ip = c$id$resp_h;
    
    # Set ports (convert to count for JSON compatibility)
    if (proto_name != icmp) {
        info$src_port = port_to_count(c$id$orig_p);
        info$dest_port = port_to_count(c$id$resp_p);
    }
    
    # Set protocol
    info$protocol = proto_str;
    
    # Generate signature and severity based on protocol
    if (proto_name == icmp) {
        # ICMP traffic - severity 1 alert (HIGH)
        info$signature = fmt("ICMP Echo Request/Reply: %s -> %s", c$id$orig_h, c$id$resp_h);
        info$severity = 1;
    } else {
        # Other traffic - logged as activity (no severity = null)
        info$signature = fmt("%s Connection: %s:%s -> %s:%s", 
                            proto_str, 
                            c$id$orig_h, 
                            c$id$orig_p, 
                            c$id$resp_h, 
                            c$id$resp_p);
        # severity field intentionally left unset (will be null in JSON)
    }
    
    Log::write(ICMPDetector::LOG, info);
}
