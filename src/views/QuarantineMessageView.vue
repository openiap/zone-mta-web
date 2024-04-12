<template>

<div v-if="reporting" class="row">
  <div class="col">
    <div class="card">
      <h1 class="text-error">{{ reporting }}</h1>
      </div>
    </div>
  </div>
  <div v-if="errormessage" class="row">
    <div class="col">
      <div class="card">
        <h1 class="text-error">{{ errormessage }}</h1>
      </div>
    </div>
  </div>
  <div class="row" v-if="!errormessage">
    <div class="col">
      <button v-if="this.item != null" type="button" class="button primary col-3" v-on:click="Deliver">Deliver</button>
      <!-- <button v-if="this.item != null" type="button" class="button primary col-3" v-on:click="ReSubmit">Resubmit (NEW)</button> -->
      <button @click="Delete" class="button secondary">Delete</button>
      <button v-if="this.item != null" type="button" class="button primary col-3" v-on:click="Report">Report</button>
    </div>
  </div>

  <div class="tabset" v-if="!errormessage">
    <input type="radio" name="tabset" id="tab1" aria-controls="envelope" checked>
    <label for="tab1">Envelope</label>
    <input type="radio" name="tabset" id="tab2" aria-controls="body" @click="GetBody">
    <label for="tab2">Body</label>
    <input type="radio" name="tabset" id="tab3" aria-controls="htmlbody" @click="GetBody">
    <label for="tab3">HTML Body</label>
    <input type="radio" name="tabset" id="tab4" aria-controls="headers">
    <label for="tab4">Headers</label>
    <div class="tab-panels">
      <section id="envelope" class="tab-panel" >
        <div class="table-responsive" style="margin-top: 10px;">
          <table class="table table-bordered">
            <tr>
              <th class="col-md-2">
                Queue ID
              </th>
              <td>
                <router-link v-if="this.id != '' && this.id != null && this.seq != '' && this.seq != null" :to="{ name: 'QuarantineWithId', params: { id: this.id }}">{{this.id}}
                </router-link>
                <span v-if="this.seq == '' || this.seq == null">{{this.id}}</span>
              </td>
            </tr>
            <tr>
              <th class="col-md-2">
                MAIL FROM
              </th>
              <td>
                {{ item.from || meta.from }}
              </td>
            </tr>
            <tr>
              <th class="col-md-2">
                RCPT TO
              </th>
              <td>
                {{ item.recipient || meta.to }}
              </td>
            </tr>
            <tr>
              <th class="col-md-2">
                Subject
              </th>
              <td>
                {{ subject }}
              </td>
            </tr>
            <tr>
              <th class="col-md-2">
                Queue
              </th>
              <td>
                {{ item.sendingZone || "archive" }}
              </td>
            </tr>
            <tr>
              <th class="col-md-2">
                Download
              </th>
              <td>
                <a href="javascript:void(0)" @click="Download">Download</a>
              </td>
            </tr>
          </table>
        </div>
      </section>
      <section id="body" class="tab-panel">
        <pre class="col">{{ bodyContent }}</pre>
      </section>
      <section id="headers" class="tab-panel">
        <div id="htmlbodydiv"></div>
        <br /><div v-html="htmlbodyContent"></div>
      </section>
      <section id="headers" class="tab-panel">
        <pre class="col">{{ headersContent }}</pre>
      </section>
    </div>

  </div>

  <table v-if="!errormessage && messages.length > 0">
    <tr>
      <td>
        #
      </td>
      <td>
        Queue ID
      </td>
      <td>
        Recipient
      </td>
    </tr>
    <tr v-for="(mitem, index) in messages">
      <td>
        {{ mitem.seq }}
      </td>
      <td>
        <router-link v-if="mitem.id != '' && mitem.id != null" :to="{ name: 'QuarantineWithSeqId', params: { id: mitem.id, seq: mitem.seq }}">{{mitem.id}}
        </router-link>
      </td>
      <td>
        {{ mitem.recipient }}
      </td>
    </tr>
  </table>

  <table v-if="!errormessage && events.length > 0">
    <tr>
      <td>
        when
      </td>
      <td>
        action
      </td>
      <td>
        to
      </td>
    </tr>
    <tr v-for="(mitem, index) in events">
      <td>
        {{ _timeSince(mitem._created) }}
      </td>
      <td>
        {{ mitem.action }}
      </td>
      <td>
        {{ mitem.to }}
      </td>
    </tr>
  </table>

  

  <div class="row"  v-if="!errormessage">
    <div class="col">
      <button type="button" class="button primary col-3" v-on:click="Deliver">Deliver</button>
      <!-- <button v-if="this.item != null" type="button" class="button primary col-3" v-on:click="ReSubmit">Resubmit (NEW)</button> -->
      <button @click="Delete" class="button secondary" v-shortkey.propagte="['del']" @shortkey="Delete">Delete</button>
    </div>
  </div>
  <button @click="Back" class="button hidden" v-shortkey.propagte="['esc']" @shortkey="Back">Escape
        key</button>
</template>
<script>
import { mapGetters } from 'vuex';
import editableTextField from '@/components/editableTextField.vue';
import ResizeByMixin from '@/components/ResizeByMixin.vue';
import TypeAheadQuery from '@/components/TypeAheadQuery.vue';
import ACL from '@/components/ACL.vue';
import { Util } from '@/Util';
import { Base } from "./../Base"

import { EmlReader } from './EmlReader';
export default {
  name: 'EntityView',
  emits: ['update:item'],
  components: {
    editableTextField,
    ResizeByMixin,
    TypeAheadQuery,
    ACL
  },
  data() {
    return {
      json: "",
      filecontent: [],
      item: new Base(),
      messages: [],
      events: [],
      meta: {},
      subject: '',
      errormessage: '',
      reporting: '',
      editingname: '',
      emitevents: false,
      newname: 'newname',
      mode: 'form',
      user: new Base()
    }
  },
  props: ['id', 'seq'],
  computed: {
    ...mapGetters(['Signedin', 'Client']),
    headersContent() {
      let headers = null;
      if(this.meta?.headers != null) {
        headers = JSON.parse(JSON.stringify(this.meta?.headers));
        if(headers.lines != null) {
          headers = headers.lines
        }
      }
      return headers?.map(x => x.line).join('\n') || 'No headers available';
    },
    htmlbodyContent() {
      if (this.filecontent.length > 0) {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(this.filecontent);
        const email = new EmlReader(this.filecontent);
        console.log(email.getMessageText());
        console.log(email.getMessageHtml());
        return email.getMessageHtml()
        // console.log(email.getDate());
        // console.log(email.getSubject());
        // console.log(email.getFrom());
        // console.log(email.getCc());
        // console.log(email.getTo());
        // console.log(email.getReplyTo());
        // console.log(email.getAttachments());



        
        // // Pattern to find the HTML part of the email
        // const pattern = /Content-Type: text\/html; charset=UTF-8\s*Content-Transfer-Encoding: quoted-printable\s*([\s\S]*?)--/i;

        // // Attempt to find the HTML content
        // const match = text.match(pattern);

        // // If found, return the HTML content, else return a default message
        // if (match && match[1]) {
        //   // const body = this.decodeQuotedPrintable(match[1]).trim();
        //   const body = match[1].trim();
        //   // The actual HTML content is in the first capturing group
        //   // console.log(body.length, body)
        //   // document.getElementById("htmlbodydiv").innerHTML = body;
        //   // return body

        //   // // Create the iframe element
        //   // var iframe = document.createElement('iframe');

        //   // // Optional: Set some basic styles to ensure visibility and appropriate sizing
        //   // iframe.style.width = '100%';
        //   // iframe.style.height = '400px'; // You may want to adjust this
        //   // iframe.style.border = 'none'; // Hides the iframe border

        //   // // iframe.srcdoc = body;

        //   // // Append the iframe to the document or a specific element
        //   // document.getElementById("htmlbodydiv").appendChild(iframe);

        //   // // // Write the HTML content into the iframe
        //   // // // Note: This method might vary depending on how strictly you want to sandbox the content
        //   // var doc = iframe.contentWindow.document;
        //   // doc.open();
        //   // doc.write(body);
        //   // doc.close();
        //   // return "";
        // } else {
        //   return 'No HTML content found';
        // }
      }
      return 'No body available';
    },
    bodyContent() {
      if(this.filecontent.length > 0) {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(this.filecontent);
        return text;
      }
      return 'No body available';
    }
  },
  created() {
    this.GetData()
  },
  watch: {
    Signedin: function (val, oldVal) {
      if (val == true && oldVal != val) {
        this.GetData();
      }
    },
    id: function (val, oldVal) {
      if (!Util.IsNullEmpty(val) == true && oldVal != val) {
        this.GetData();
      }
    },
  },
  methods: {
    decodeQuotedPrintable(content) {
        // Normalize =3D to = for HTML attribute compatibility
    let decodedContent = content.replace(/=3D/g, '=');

// Remove HTML comments
decodedContent = decodedContent.replace(/<!--[\s\S]*?-->/g, '');

// // Explicitly remove DOCTYPE, and other undesired tags or declarations
// decodedContent = decodedContent.replace(/<!DOCTYPE[^>]*>/gi, '');

// // Remove SCRIPT and STYLE tags (and their content) for security and style reasons
// decodedContent = decodedContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
// decodedContent = decodedContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');

// // Decode soft line breaks
// decodedContent = decodedContent.replace(/=\r\n|=\n/g, '');

// // Decode quoted-printable encoding
// decodedContent = decodedContent.replace(/=([a-fA-F0-9]{2})/g, function (match, p1) {
//     return String.fromCharCode(parseInt(p1, 16));
// });

      // // First, replace =3D with = to fix HTML tag attributes
      // let decodedContent = content.replace(/=3D/g, '=');

      // // Remove HTML comments
      // decodedContent = decodedContent.replace(/<!--[\s\S]*?-->/g, '');

      // // Explicitly remove DOCTYPE, and other undesired tags or declarations
      // decodedContent = decodedContent.replace(/<!doctype html[^>]*>/gi, '');
      // decodedContent = decodedContent.replace(/<\/?(html|head|body|meta|link|title)[^>]*>/gi, '');

      // // Optional: Remove SCRIPT tags along with their content for security reasons
      // decodedContent = decodedContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');

      // // Optional: Remove STYLE tags along with their content to avoid styling conflicts
      // decodedContent = decodedContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');

      // // Replace soft line breaks (soft line breaks are "=\r\n" or "=\n")
      // decodedContent = decodedContent.replace(/=\r\n|=\n/g, '');

      // // Replace all =XX (where XX is hexadecimal) with the actual character
      // decodedContent = decodedContent.replace(/=([a-fA-F0-9]{2})/g, function (match, p1) {
      //   return String.fromCharCode(parseInt(p1, 16)); // Convert hex to character
      // });

      // // Whitelist of allowed tags
      // const allowedTags = /<\/?(div|strong|table|tr|td|th|tbody|thead|tfoot|ul|ol|li|p|br|h[1-6]|span|em|i|b)[^>]*>/gi;

      // // Remove all tags not in the whitelist
      // // This creates a pattern to match any tag that is not in the whitelist
      // const removeOtherTags = /<\/?([a-z][a-z0-9]*)(\s+[^>]*)?>/gi;
      // decodedContent = decodedContent.replace(removeOtherTags, function (match, p1) {
      //   // If the tag is in the whitelist, keep it, otherwise replace with empty string
      //   return match.match(allowedTags) ? match : '';
      // });

      return decodedContent;
    },
    async Report() {
      try {
        this.reporting = 'downloading message'
        await this.GetBody();
        const decoder = new TextDecoder('utf-8');
        const data = decoder.decode(this.filecontent);
        this.reporting = 'Posting message to /api/email'
        // Post data to /api/email
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: this.id,
            seq: this.seq,
            email: data
          })
        });
        var body = await response.text();
        this.reporting = 'Message reported ' + body
        console.log(body);
      } catch (error) {
        console.error(error);
        this.reporting = 'Error: ' + error.message;
      }
    },
    async Deliver() {
      /** @type {import("@openiap/jsapi").openiap} */
      var c = this.Client;
      try {
        this.item.Deliver = "default";
        // await this.Client.UpdateOne({ collectionname: this.collectionname, item: this.item });
        if(this.seq == null || this.seq == "") {
          // await this.Client.UpdateDocument({ collectionname: this.collectionname, query: { id: this.id }, document: { "$set": { sendingZone: "default", lockTime: 0, assigned: "no" }, "$unset": { _deferred: "" } } });
          await this.Client.UpdateDocument({ collectionname: this.collectionname, query: { id: this.id }, document: { "$set": { sendingZone: "default"} } });
        } else {
          // await this.Client.UpdateDocument({ collectionname: this.collectionname, query: { id: this.id, seq: this.seq }, document: { "$set": { sendingZone: "default", lockTime: 0, assigned: "no" }, "$unset": { _deferred: "" } } });
          await this.Client.UpdateDocument({ collectionname: this.collectionname, query: { id: this.id, seq: this.seq }, document: { "$set": { sendingZone: "default" } } });
        }
        this.GetData();
      } catch (error) {
        this.errormessage = error.message;
      }
    },
    // async ReSubmit() {
    //   await this.GetBody();
    //   if (this.filecontent.length == 0) {
    //     console.log("No body available")
    //     return;
    //   }
    //   const SMTPclient = require("nodemailer").createTransport({
    //     host: "cloud.openiap.io",
    //     port: 25
    //   });
    //   const decoder = new TextDecoder('utf-8');
    //   const text = decoder.decode(this.filecontent);
    //   SMTPclient.sendMail({ raw: text }, (err, info) => {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       console.log(info);
    //     }
    //   });
    // },
    async Delete() {
      try {
        if(this.seq == null || this.seq == "") {
          await this.Client.DeleteMany({ collectionname: this.collectionname, query: { id: this.id } });
        } else {
          await this.Client.DeleteMany({ collectionname: this.collectionname, query: { id: this.id, seq: this.seq } });
        }
        this.Back()
      } catch (error) {
        this.errormessage = error.message;
      }
    },
    async GetBody() {
      if(this.filecontent.length == 0) {
        console.log("Download message", this.id, "from", "archive.files")
        try {
          this.filecontent = await this.Client.DownloadFile({ filename: "message " + this.id, collectionname: "archive.files" })
        } catch (error) {
        }
      }
      if(this.filecontent.length == 0) {
        console.log("Download message", this.id, "from", "mail.files")
        try {
          this.filecontent = await this.Client.DownloadFile({ filename: "message " + this.id, collectionname: "mail.files" })
        } catch (error) {
        }
      }
    },
    async Download() {
      await this.GetBody();
      var blob = new Blob([this.filecontent], { type: this.item.contentType });
      var link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = this.id + ".eml";
      link.click();

    },
    Back() {
      this.$router.push({ name: 'quarantine' });
    },
    async GetData() {
      this.collectionname = "zone-queue";
      this.item.name = "new item";
      if (this.Signedin == true && !Util.IsNullEmpty(this.id)) {
        if (this.seq == null || this.seq == "") {
          var results = await this.Client.Query({ collectionname: this.collectionname, query: { id: this.id }, top: 1 });
          console.log("no seq", results)
        } else {
          var results = await this.Client.Query({ collectionname: this.collectionname, query: { id: this.id, seq: this.seq }, top: 1 });
          console.log("with seq", results)
        }
        
        if (results.length > 0) {
          this.item = results[0];
          console.log("item", JSON.parse(JSON.stringify(this.item)))
          this.json = JSON.stringify(this.item, null, 2);
        } else {
          console.log("no item")
          // this.errormessage = "Item not found"
          // return;
        }
        var results = await this.Client.Query({ collectionname: "mail.files", query: { filename: "message " + this.id }, top: 1 });
          if (results.length == 0) {
            results = await this.Client.Query({ collectionname: "archive.files", query: { filename: "message " + this.id }, top: 1 });
          }
          if (results.length > 0) {
            this.meta = results[0].metadata.data;
          }

        if ((this.seq == null || this.seq == "")) {
          this.messages = await this.Client.Query({ collectionname: this.collectionname, query: { id: this.id } });
        }
        this.events = await this.Client.Query({ collectionname: "mailevents", query: { id: this.id } });
        // order this.events by _created
        this.events = this.events.sort((a, b) => {
          return new Date(b._created) - new Date(a._created);
        });

        
        if(this.item != null && this.item.subject != null ) {
            this.subject = this.item.subject;
        } else {
          let headers = null;
          if (this.meta?.headers != null) {
            headers = JSON.parse(JSON.stringify(this.meta?.headers));
            if (headers.lines != null) {
              headers = headers.lines
            }
            let subjectline = headers?.find(x => x.key == "subject");
            if (subjectline != null) {
              this.subject =  subjectline.line.substring(9);
            }
          }

        }
      }
    },
    _timeSince(timeStamp) {
      try {
        timeStamp = new Date(timeStamp);
      } catch (error) {
        return;
      }
      const now = new Date(),
        secondsPast = (now.getTime() - timeStamp.getTime()) / 1000;
      if (secondsPast < 60) {
        return parseInt(secondsPast.toString()) + 's ago';
      }
      if (secondsPast < 3600) {
        return parseInt((secondsPast / 60).toString()) + 'm ago';
      }
      if (secondsPast <= 86400) {
        return parseInt((secondsPast / 3600).toString()) + 'h ago';
      }
      if (secondsPast > 86400) {
        let day = timeStamp.getDate();
        let month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
        let year = timeStamp.getFullYear() == now.getFullYear() ? "" : " " + timeStamp.getFullYear();
        return day + " " + month + year;
      }
    },

  }
}
</script>

<style scoped>
.operation-icon {
  margin-bottom: -5px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.operation-icon.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

body.dark .operation-icon {
  filter: invert(100%);
}

.row {
  display: flex;
}

.col {
  flex: 1;
  border: 1px #ccc;
  align-self: flex-end;
}






.tabset>input[type="radio"] {
  position: absolute;
  left: -200vw;
}

.tabset .tab-panel {
  display: none;
}

.tabset>input:first-child:checked~.tab-panels>.tab-panel:first-child,
.tabset>input:nth-child(3):checked~.tab-panels>.tab-panel:nth-child(2),
.tabset>input:nth-child(5):checked~.tab-panels>.tab-panel:nth-child(3),
.tabset>input:nth-child(7):checked~.tab-panels>.tab-panel:nth-child(4),
.tabset>input:nth-child(9):checked~.tab-panels>.tab-panel:nth-child(5),
.tabset>input:nth-child(11):checked~.tab-panels>.tab-panel:nth-child(6) {
  display: block;
}

body {
  font: 16px/1.5em "Overpass", "Open Sans", Helvetica, sans-serif;
  color: #333;
  font-weight: 300;
}

.tabset>label {
  position: relative;
  display: inline-block;
  padding: 15px 15px 25px;
  border: 1px solid transparent;
  border-bottom: 0;
  cursor: pointer;
  font-weight: 600;
}

.tabset>label::after {
  content: "";
  position: absolute;
  left: 15px;
  bottom: 10px;
  width: 22px;
  height: 4px;
  background: #8d8d8d;
}

input:focus-visible+label {
  outline: 2px solid rgba(0, 102, 204, 1);
  border-radius: 3px;
}

.tabset>label:hover,
.tabset>input:focus+label,
.tabset>input:checked+label {
  color: #06c;
}

.tabset>label:hover::after,
.tabset>input:focus+label::after,
.tabset>input:checked+label::after {
  background: #06c;
}

.tabset>input:checked+label {
  border-color: #ccc;
  border-bottom: 1px solid #fff;
  margin-bottom: -1px;
}

.tab-panel {
  padding: 30px 0;
  border-top: 1px solid #ccc;
}

/*
 Demo purposes only
*/
*,
*:before,
*:after {
  box-sizing: border-box;
}

body {
  padding: 30px;
}

/* .tabset {
  max-width: 65em;
} */
</style>
