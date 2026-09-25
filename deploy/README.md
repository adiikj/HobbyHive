# Deploy (1 GB VM: API + ML)

Measured peaks: API ~160 MB, ML ~245 MB. The frontend is hosted separately.

```bash
./deploy/setup-swap.sh                                 # once
cd apps/ml && uv sync --no-default-groups              # runtime deps only
cd ../backend && pnpm install --prod=false && pnpm build
sudo cp deploy/*.service /etc/systemd/system/ && sudo systemctl daemon-reload
sudo systemctl enable --now hobbyhive-ml hobbyhive-backend
```

Set `BEA_LOCAL_LLM=1` (and `uv sync --group llm`) only on hosts with ~1 GB spare for the ML service.
