# zone mta web interface

- deploy this project to openflow as a package
- start an agent in docker/kubernetes or re-use the agent for the backend
- deploy the package, with the following envoriment variables set ( if you want to allow reporting spam to [spamcop](https://www.spamcop.net/) frm the web interface)
```
{
  "report_email_from": "your@email.com",
  "report_email_to": "your-spamcop-report-id@spam.spamcop.net",
  "report_email_host": "vmx.spamcop.net"
}
```
- if not already done, deploy the [smtp backend](https://github.com/openiap/zone-mta-ai-spam-check).