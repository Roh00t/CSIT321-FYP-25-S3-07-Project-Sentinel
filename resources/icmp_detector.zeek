##! ICMP Detection Script
##! Generates alerts for ICMP traffic with severity 1
##! All other traffic logged with null severity (activity)
##! sudo cp icmp_detector_json.zeek /opt/zeek/share/zeek/site/
##! echo '@load icmp_detector_json.zeek' | sudo tee -a /opt/zeek/share/zeek/site/local.zeek
##! Edit /opt/zeek/etc/node.cfg set interface=ens33
##! sudo ./bin/zeekctl deploy

@load base/protocols/conn

module ICMPDetector;

export {
    redef enum Log::ID += { LOG };

    type Info: record {
        ts: time &log;
        src_ip: addr &log;
        src_port: port &log &optional;
        dest_ip: addr &log;
        dest_port: port &log &optional;
        proto: string &log;
        alert: string &log;
        severity: count &log &optional;
    };
}

redef record connection += {
    icmp_detector: Info &optional;
};

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
    info$ts = c$start_time;
    
    # Set IPs
    info$src_ip = c$id$orig_h;
    info$dest_ip = c$id$resp_h;
    
    # Set ports (if not ICMP)
    if (proto_name != icmp) {
        info$src_port = c$id$orig_p;
        info$dest_port = c$id$resp_p;
    }
    
    # Set protocol
    info$proto = proto_str;
    
    # Generate alert based on protocol
    if (proto_name == icmp) {
        # ICMP traffic - priority 1 alert
        info$alert = fmt("ICMP Echo Request/Reply detected from %s to %s", c$id$orig_h, c$id$resp_h);
        info$severity = 1;
    } else {
        # Other traffic - logged as activity (no severity)
        info$alert = fmt("%s connection from %s:%s to %s:%s", 
                        proto_str, 
                        c$id$orig_h, 
                        c$id$orig_p, 
                        c$id$resp_h, 
                        c$id$resp_p);
        # severity field left unset (null)
    }
    
    Log::write(ICMPDetector::LOG, info);
}
