#!/bin/bash
set -e

BOOTSTRAP=${KAFKA_BOOTSTRAP_SERVERS:-kafka:9092}
PARTITIONS=6
REPLICATION=1

topics=(
  "events.person.raw"
  "events.account.raw"
  "events.card.raw"
  "events.person.stored"
  "events.account.stored"
  "events.card.stored"
  "triggers.consolidation"
)

echo "Waiting for Kafka at $BOOTSTRAP..."
until kafka-topics.sh --bootstrap-server "$BOOTSTRAP" --list > /dev/null 2>&1; do
  sleep 2
done
echo "Kafka is ready."

for topic in "${topics[@]}"; do
  kafka-topics.sh --create \
    --if-not-exists \
    --bootstrap-server "$BOOTSTRAP" \
    --topic "$topic" \
    --partitions "$PARTITIONS" \
    --replication-factor "$REPLICATION"
  echo "  ✓ $topic"
done

echo "All topics created."
