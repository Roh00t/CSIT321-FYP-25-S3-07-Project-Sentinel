"""Import PCAP packet rows from a TSV/CSV into the database.

Usage:
  python import_pcap_tsv.py path/to/rows.tsv [--create-files] [--dry-run]

The input file should have a header with columns similar to:
  id\tpcap_file_id\tpacket_number\ttimestamp\tsrc_ip\tdst_ip\tsrc_port\tdst_port\tprotocol\tpacket_length\tpacket_data

packet_data may be a hex string starting with 0x. 'NULL' values are supported.

This script uses the application's Flask app context and SQLAlchemy models.
"""
import sys
import csv
import argparse
from datetime import datetime
import os

from app import create_app, db
from app.models.pcap import PcapFile, PcapPacket
from app.models.app_user import AppUser


def parse_hex_data(s):
    if s is None:
        return None
    s = s.strip()
    if not s or s.upper() == 'NULL':
        return None
    if s.startswith('0x') or s.startswith('0X'):
        s = s[2:]
    # ensure even length
    if len(s) % 2 != 0:
        s = '0' + s
    try:
        return bytes.fromhex(s)
    except Exception:
        return None


def parse_int(v):
    if v is None:
        return None
    v = v.strip()
    if not v or v.upper() == 'NULL':
        return None
    try:
        return int(v)
    except Exception:
        return None


def parse_timestamp(ts):
    if not ts or ts.upper() == 'NULL':
        return None
    ts = ts.strip()
    # try common formats
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S'):
        try:
            return datetime.strptime(ts, fmt)
        except Exception:
            continue
    # last resort: try to parse by splitting
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def import_file(path, create_files=False, dry_run=False):
    created_packets = 0
    created_files = 0
    with open(path, 'r', encoding='utf-8') as fh:
        # Try to detect delimiter (tab or comma)
        first = fh.readline()
        if '\t' in first:
            delim = '\t'
        else:
            delim = ','
        fh.seek(0)
        reader = csv.DictReader(fh, delimiter=delim)

        with create_app().app_context():
            # Find default user (appuserpro) for creating PcapFile if needed
            default_user = AppUser.query.filter_by(username='appuserpro').first()
            default_user_id = default_user.id if default_user else None

            to_commit = []
            for row in reader:
                # Map fields
                pcap_file_id = parse_int(row.get('pcap_file_id') or row.get('pcapfileid') or row.get('pcap_file'))
                packet_number = parse_int(row.get('packet_number'))
                timestamp = parse_timestamp(row.get('timestamp'))
                src_ip = row.get('src_ip') or row.get('src')
                dst_ip = row.get('dst_ip') or row.get('dst')
                src_port = parse_int(row.get('src_port'))
                dst_port = parse_int(row.get('dst_port'))
                protocol = row.get('protocol')
                packet_length = parse_int(row.get('packet_length'))
                packet_data = parse_hex_data(row.get('packet_data'))

                if not pcap_file_id:
                    print(f"Row missing pcap_file_id, skipping: {row}")
                    continue

                pcap_file = PcapFile.query.get(pcap_file_id)
                if not pcap_file:
                    if create_files:
                        pcap_file = PcapFile(filename=f"imported_{pcap_file_id}", user_id=default_user_id or 1)
                        if not dry_run:
                            db.session.add(pcap_file)
                            db.session.flush()  # get id
                        created_files += 1
                        print(f"Created PcapFile id={pcap_file_id} (temporary id={pcap_file.id})")
                    else:
                        print(f"PcapFile id={pcap_file_id} not found; pass --create-files to auto-create. Skipping row.")
                        continue

                packet = PcapPacket(
                    pcap_file_id=pcap_file_id,
                    packet_number=packet_number,
                    timestamp=timestamp or datetime.utcnow(),
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    src_port=src_port,
                    dst_port=dst_port,
                    protocol=protocol,
                    packet_length=packet_length,
                    packet_data=packet_data
                )

                if dry_run:
                    created_packets += 1
                else:
                    db.session.add(packet)
                    created_packets += 1

            if not dry_run:
                db.session.commit()

    print(f"Import finished. Packets/rows processed: {created_packets}. PcapFiles created: {created_files}.")


def main():
    parser = argparse.ArgumentParser(description='Import PCAP rows TSV/CSV into DB')
    parser.add_argument('file', help='Path to TSV/CSV file')
    parser.add_argument('--create-files', action='store_true', help='Create missing PcapFile entries')
    parser.add_argument('--dry-run', action='store_true', help='Do not commit to DB, only validate')
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print('File not found:', args.file)
        sys.exit(1)

    import_file(args.file, create_files=args.create_files, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
