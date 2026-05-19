#!/bin/bash
set -e

mkdir -p keys

openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

echo "RSA keypair generated in keys/"
echo "  private key: keys/private.pem"
echo "  public key:  keys/public.pem"
