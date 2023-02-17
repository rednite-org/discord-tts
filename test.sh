read -r -d '' TEXT << EOM
> Я Яндекс Спичк+ит.
> Я могу превратить любой текст в речь.
> Теперь и в+ы — можете!
EOM
export FOLDER_ID=b1ggv94mt5nrd3bftldp
export IAM_TOKEN=t1.9euelZqekIuXjZuNmczMk5GMi8-Zlu3rnpWayMnMxpGVk8yeyZGQzZebz5Ll9PcqI3tg-e8KcGnq3fT3alF4YPnvCnBp6s3n9euelZqMypHLys2cmInKlMqRlpORiu_9.8JsJ22K-7iigO-jnbag1Bi6Zj8YB9Uz70h4gDbpX8MqKuThBPR_rmyoJbV4ubcOv0zhsXSIEi6anudvG5jPIBA
curl -X POST \
  -H "Authorization: Bearer ${IAM_TOKEN}" \
  --data-urlencode "text=${TEXT}" \
  -d "lang=ru-RU&voice=filipp&folderId=${FOLDER_ID}" \
  "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize" > speech.ogg