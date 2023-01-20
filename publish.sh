#! /bin/bash

HEX=2kgrv5ga2i
NAME=peerhex-playground-photos-$HEX

set -eo pipefail

. .env

mkdir -p tmp

npm run build

echo Adding to IPFS...
(
	set +e
	ipfs add -Q -r --pin=false build > ./tmp/cid.txt
	if [ $? != 0 ]; then
		echo "Retrying... (with 60s sleep)"
		set -e
		sleep 60
		ipfs add -Q -r --pin=false build > ./tmp/cid.txt
	fi
)
export CID=$(cat ./tmp/cid.txt)
echo CID $CID

echo Pinning to IPFS Cluster...

HOST=/dns4/pq-pop-ca-1-cluster.infra.hex.camp/tcp/443
BASIC_AUTH=admin:$IPFS_CLUSTER_PASSWORD

#set -x

ipfs-cluster-ctl --host $HOST --basic-auth=$BASIC_AUTH \
                  pin add --name $NAME --wait --wait-timeout 300s $CID

echo Removing old pins...

# Remove old pins
ipfs-cluster-ctl --host $HOST --basic-auth=$BASIC_AUTH \
	pin ls | grep "| $NAME |" | sed 's/Added: \(.*\) \(.*\)/Added: \1_\2/' | sort -k23 | tail -3
PRESERVE=$(echo $(ipfs-cluster-ctl --host $HOST --basic-auth=$BASIC_AUTH \
	pin ls | grep "| $NAME |" | sed 's/Added: \(.*\) \(.*\)/Added: \1_\2/' | sort -k23 | tail -3 | awk '{ print $1 }'))
echo Preserve last 3: $PRESERVE
for cid in `ipfs-cluster-ctl --host $HOST --basic-auth=$BASIC_AUTH \
	pin ls | grep "| $NAME |" | awk '{ print $1 }'`; do
	# https://stackoverflow.com/questions/3685970/check-if-a-bash-array-contains-a-value
	if [[ " $PRESERVE " =~ " $cid " ]]; then
		echo "$cid: preserve"
	else
		echo "$cid: delete"
		ipfs-cluster-ctl --host $HOST --basic-auth=$BASIC_AUTH \
			pin rm $cid
	fi
done

## Update Route53

HOSTED_ZONE_ID=Z0776169RPXDLRHZOI9Q

echo Hex: $HEX CID: $CID

JSON="$(cat <<EOF
    {
      "Changes": [
        {
          "Action": "UPSERT",
          "ResourceRecordSet": {
            "Name": "_dnslink.$HEX.hex.camp",
            "Type": "TXT",
            "TTL": 30,
            "ResourceRecords": [
              {
                "Value": "\"dnslink=/ipfs/$CID\""
              }
            ]
          }
        }
      ]
    }
EOF
)"

echo $JSON
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch "$JSON"

