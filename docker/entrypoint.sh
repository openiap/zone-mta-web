#!/bin/bash

rm -rf ./config.json
touch ./config.json
# begin json object
echo "{" >> ./config.json
# Read each line in .env file
# Each line represents key=value pairs
firstline=true
while read -r line || [[ -n "$line" ]];
do
  # Split env variables by character `=`
  if printf '%s\n' "$line" | grep -q -e '='; then
    varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
    varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
  fi
  # Read value of current variable if exists as Environment variable
  value=$(printf '%s\n' "${!varname}")
  # Otherwise use value from .env file
  [[ -z $value ]] && value=${varvalue}

  value="$(echo "$value"|tr -d '\n')"
  if [ "$firstline" = true ] ; then
    firstline=false
    echo "  \"$varname\": \"$value\" " >> ./config.json
  else
  echo "  ,\"$varname\": \"$value\" " >> ./config.json
  fi
  
done < .env.production
echo "}" >> ./config.json
nginx -g "daemon off;"

#/bin/sh
#/bin/bash

# ROOT_DIR=/usr/share/nginx/html

# # Replace env vars in JavaScript files
# echo "Replacing env constants in JS"
# # for file in $ROOT_DIR/js/app.*.js* $ROOT_DIR/index.html $ROOT_DIR/precache-manifest*.js;
# # do
# #   echo "Processing $file ...";

# #   sed -i 's|VUE_APP_CONFIG_URL|'${VUE_APP_CONFIG_URL}'|g' $file 
# #   sed -i 's|VUE_APP_AUTHORITY|'${VUE_APP_AUTHORITY}'|g' $file
# #   sed -i 's|VUE_APP_CLIENT_ID|'${VUE_APP_CLIENT_ID}'|g' $file
# #   sed -i 's|VUE_APP_RESPONSE_TYPE|'${VUE_APP_RESPONSE_TYPE}'|g' $file
# #   sed -i 's|VUE_APP_PROMPT|'${VUE_APP_PROMPT}'|g' $file

# # done

# echo "Starting Nginx"
# nginx -g 'daemon off;'
