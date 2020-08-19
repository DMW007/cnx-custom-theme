#!/bin/bash
npx gulp

host=centos@cnx65.internal
args=StrictHostKeyChecking=no
cssFile=dist/css/custom-all.css

# Requires package inotify-tools
echo "$(date): Start watching $cssFile for changes"
inotifywait -mrq -e close_write --format %w%f $cssFile| while read FILE
do
    echo "$(date): File $FILE was changed, upload to IHS..."

    sftp -o $args -b /dev/stdin $host <<EOF 
    put $cssFile /tmp
    bye
EOF

    ssh -o $args $host "sudo mv /tmp/custom-all.css /opt/IBM/HTTPServer/htdocs"
    echo -e "$(date): Upload finished\n"
done