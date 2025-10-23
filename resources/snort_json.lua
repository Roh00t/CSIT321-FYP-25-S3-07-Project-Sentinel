-- Load base config
dofile('/usr/local/etc/snort/snort.lua')

-- Include your rule file
ips =
{
    rules = [[
        include /home/a/snort3/lua/icmp.rules
    ]]
}

-- JSON alert logging config
alert_json =
{
    file   = true,
    limit  = 0,  -- 0 means no limit / unlimited
    fields = 'timestamp pkt_num proto pkt_len dir src_ap dst_ap msg class sid gid rev rule action priority'
}
