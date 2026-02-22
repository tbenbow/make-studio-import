#!/bin/bash
# Reads .state/active.json and displays workflow progress bar
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // "claude"')
cwd=$(echo "$input" | jq -r '.workspace.project_dir // .cwd')
state_file="$cwd/.state/active.json"

if [ -f "$state_file" ] && [ -s "$state_file" ]; then
  workflow=$(jq -r '.workflow // ""' "$state_file")
  theme=$(jq -r '.theme // ""' "$state_file")
  current=$(jq -r '.currentPhase // 0' "$state_file")
  total=$(jq '.phases | length' "$state_file")
  done_count=$(jq '[.phases[] | select(.status == "done")] | length' "$state_file")
  phase_name=$(jq -r ".phases[$current].name // \"\"" "$state_file")

  # Build progress bar (10 segments)
  filled=$((done_count * 10 / total))
  bar=""
  for i in $(seq 1 10); do
    if [ $i -le $filled ]; then bar="${bar}█"; else bar="${bar}░"; fi
  done

  printf "\033[2m%s\033[0m %s \033[36m%s\033[0m %s/%s │ %s │ \033[2m%s\033[0m" \
    "$workflow" "$theme" "$bar" "$done_count" "$total" "$phase_name" "$model"
else
  dir=$(basename "$cwd")
  printf "\033[2m%s\033[0m │ \033[2m%s\033[0m" "$dir" "$model"
fi
