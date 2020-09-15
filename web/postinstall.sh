#!/usr/bin/env bash

## this is your postinstall.sh script:

set -e;

if [ "$SKIP_POSTINSTALL" == "yes" ]; then
  echo "skipping package postinstall routine.";
  exit 0;
fi

echo 'fixing sourcemaps'

node ../script/fix-maps.js