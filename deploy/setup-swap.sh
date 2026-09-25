#!/usr/bin/env bash
# One-time: 1 GB swap as a safety net on a 1 GB VM (used only under pressure, not as working memory).
set -euo pipefail
if swapon --show | grep -q /swapfile; then echo "swap already on"; exit 0; fi
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-hobbyhive.conf
sudo sysctl -p /etc/sysctl.d/99-hobbyhive.conf
