##! ICMP Detection Script - JSON Output
##! Generates JSON alerts for ICMP traffic with severity 1
##! All other traffic logged with null severity (activity)
##! Compatible with Sentinel alert normalization

@load base/protocols/conn
@load policy/tuning/json-logs.zeek
@load base/bif/plugins/Zeek_ICMP.events.bif.zeek

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


# Log ICMP Echo Request
event icmp_echo_request(c: connection, icmp: icmp_info, id: count, seq: count, payload: string)
{
    local info: Info;
    info$timestamp = network_time();
    info$src_ip = c$id$orig_h;
    info$dest_ip = c$id$resp_h;
    info$protocol = "ICMP";
    info$signature = fmt("ICMP Echo Request: %s -> %s", c$id$orig_h, c$id$resp_h);
    info$severity = 1;
    Log::write(ICMPDetector::LOG, info);
}

# Log ICMP Echo Reply
event icmp_echo_reply(c: connection, icmp: icmp_info, id: count, seq: count, payload: string)
{
    local info: Info;
    info$timestamp = network_time();
    info$src_ip = c$id$orig_h;
    info$dest_ip = c$id$resp_h;
    info$protocol = "ICMP";
    info$signature = fmt("ICMP Echo Reply: %s -> %s", c$id$orig_h, c$id$resp_h);
    info$severity = 1;
    Log::write(ICMPDetector::LOG, info);
}
