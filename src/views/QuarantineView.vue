<template>
  <div v-if="reporting" class="row">
  <div class="col">
    <div class="card">
      <h1 class="text-error">{{ reporting }}</h1>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="row">
      <div class="col">
        <input type="text" ref="searchfield" v-shortkey.focus="['ctrl', 'f']" v-model="searchValue"
          v-debounce:300ms="DoSearch" placeholder="Search term or json query">
      </div>
      <div class="col">
        <footer class="is-right">
          <button @click="Reload" class="button">Reload</button>
          <button type="button" class="button primary" v-on:click="Deliver" v-if="itemsSelected.length > 0">Deliver</button>
          <button @click="Delete" class="button secondary" v-if="itemsSelected.length > 0"
            v-shortkey.propagte="['del']" @shortkey="Delete">Delete</button>
          <button v-if="itemsSelected.length > 0" type="button" class="button primary" v-on:click="Report">Report</button>
        </footer>
      </div>
      </div>
      <div class="row">
        <div class="col">

        <button class="hidden" v-shortkey.propagte="['arrowright']" @shortkey="NextPage">Next</button>
        <button class="hidden" v-shortkey.propagte="['arrowleft']" @shortkey="PreviusPage">Previus</button>
        <button class="hidden" @click="SelectAll" v-shortkey.propagte="['ctrl', 'a']" @shortkey="SelectAll">SelectAll</button>
      </div>
    </div>
  </div>
  <div v-if="errormessage" class="row">
    <div class="col">
      <div class="card">
        <h1 class="text-error">{{errormessage}}</h1>
      </div>
    </div>
  </div>
  <div class="card">
    <EasyDataTable :headers="headers" :items="items" :loading="loading" :server-items-length="serverItemsLength"
      v-model:server-options="serverOptions" :rowsItems="rowsItems" alternating must-sort
      v-model:items-selected="itemsSelected" @click-row="RowClick">

      <template #item-_created="item">
        {{ _timeSince(item._created) }}
      </template>
      <template #item-created="item">
        {{ _timeSince(item.created) }}
      </template>
      <template #item-metadata._created="item">
        {{ _timeSince(item.metadata._created) }}
      </template>
      <template #item-timestamp="item">
        {{ _timeSince(item.timestamp) }}
      </template>
      <template #item-subject="item">
        <router-link :to="{ name: 'QuarantineWithSeqId', params: { id: item.id, seq:item.seq }}">{{item.subject}}
        </router-link>
      </template>
      <template #item-id="item">
        <router-link :to="{ name: 'QuarantineWithId', params: { id: item.id }}">{{item.id}}
        </router-link>
      </template>
    </EasyDataTable>
    <small class="is-center">Click to select, left/right arrows to page/ up/down arror to change collection</small>
  </div>
</template>

<script>
import { Util } from "./../Util"
import { mapActions, mapGetters } from 'vuex'
import { vue3Debounce } from 'vue-debounce'

export default {
  props: {
    propcollectionname: { default: '' }
  },
  data() {
    return {
      errormessage: "",
      reporting: "",
      loading: false,
      searchValue: "",
      collectionname: "",
      lastSearchValue: "",
      serverItemsLength: 0,
      rowsItems: [10, 25, 50, 100],
      autoUpdateInterval: 0,
      serverOptions: {
        page: 1,
        rowsPerPage: 10,
        sortBy: '_created',
        sortType: 'desc',
      },
      headers: [
      ],
      searchfields: ['subject', 'from', 'recipient'],
      items: [
      ],
      itemsSelected: [],
      timer: null,
    }
  },
  async created() {
    this.collectionname = "zone-queue"
    this.searchValue = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_searchValue", defaultvalue: ""});
    this.serverOptions.rowsPerPage = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_rowsPerPage", defaultvalue: 10});
    this.serverOptions.sortBy = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_sortby", defaultvalue: "_created"});
    if(this.collectionname == "fs.files" && this.serverOptions.sortBy == "_created") {
      this.serverOptions.sortBy = "metadata._created"
    }
    this.serverOptions.sortType = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_sorttype", defaultvalue: "desc"});
    this.GetData()
  },
  mounted() {
    this.FocusSearch();
  },
  computed: {
    ...mapGetters(['User', 'Signedin', 'Config', 'Client', 'Cache'])
  },
  directives: {
    debounce: vue3Debounce({ lock: true })
  },
  components: {
  },
  watch: {
    Signedin: function (val, oldVal) {
      if (val == true && oldVal != val) {
        this.GetData();
      }
    },
    collectionname: async function (val, oldVal) {
      if (!Util.IsNullEmpty(val) == true && oldVal != val) {
        this.searchValue = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_searchValue", defaultvalue: ""});
        this.PageStateSet({key: "quarantine_collection", value: val});
        // this.$router.push(`events/${val}`)
        // this.$router.replace({ path: `/events/${val}` })
        this.itemsSelected = [];
        this.serverItemsLength = 0;
        this.serverOptions.page = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_page", defaultvalue: 1});
        this.serverOptions.sortBy = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_sortby", defaultvalue: "_created"});
        if(this.collectionname == "fs.files" && this.serverOptions.sortBy == "_created") {
          this.serverOptions.sortBy = "metadata._created"
        }

        this.serverOptions.sortType = await this.PageStateGet({key: "quarantine_" + this.collectionname + "_sorttype", defaultvalue: "desc"});
        this.GetData();
      }
    },
    serverOptions: {
      handler: function (val, oldVal) {
        if (oldVal != val) {
          this.GetData();
        }
      },
      deep: true
    }
  },
  beforeMount() {
    this.addAutoUpdate();
  },
  beforeUnmount() {
    this.cancelAutoUpdate();
  },
  methods: {
    ...mapActions(['PageStateGet','PageStateSet']),
    editItem(item) {
      this.$router.push({ name: 'EntityViewWithId', params: { collectionname: this.collectionname, id: item._id } });
    },
    openlinkItem(item) {
      if(item.href != "" && item.href != null) {
        window.open(item.href, '_blank');
      }
    },
    async downloadFile(item) {
      try {
        console.log("downloading file", item)
        var filecontent = await this.Client.DownloadFile({ id: item._id })
        var blob = new Blob([filecontent], { type: item.contentType });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = item.name || item.metadata.name;
        link.click();

        // const img = document.createElement('img');
        // img.src = URL.createObjectURL(
        //   new Blob([filecontent], { type: 'image/png' })
        // );
        // document.body.appendChild(img);

      } catch (error) {
        console.error(error)
      }
    },
    RowClick(item) {
      // this.itemsSelected = [...this.itemsSelected, item];
      var rowitem = this.items.find(x => x._id == item._id);
      rowitem.isSelected = !item.isSelected;
      item.isSelected = !item.isSelected;
      this.itemsSelected = this.items.filter(x => x.isSelected == true);
      // this.itemsSelected.push(item);
    },
    Reload() {
      this.GetData();
    },
    async DoSearch() {
      if (this.lastSearchValue != this.searchValue) {
        await this.PageStateSet({key: "quarantine_" + this.collectionname + "_searchValue", value: this.searchValue});
        this.serverItemsLength = 0;
        this.serverOptions.page = 1;
        this.GetData();
      }
    },
    PreviusPage() {
      if (this.serverOptions.page > 1) {
        this.serverOptions.page--;
        this.GetData();
      }
    },
    NextPage() {
      if (this.serverOptions.page < this.serverItemsLength / this.serverOptions.rowsPerPage) {
        this.serverOptions.page++;
        this.GetData();
      }
    },
    SelectAll() {
      this.itemsSelected = this.items;
    },
    async GetBody(id) {
      let filecontent = [];
      console.log("Download message", id, "from", "archive.files")
      try {
        filecontent = await this.Client.DownloadFile({ filename: "message " + id, collectionname: "archive.files" })
      } catch (error) {
      }
      if(filecontent.length == 0) {
        console.log("Download message", id, "from", "mail.files")
        try {
          filecontent = await this.Client.DownloadFile({ filename: "message " + id, collectionname: "mail.files" })
        } catch (error) {
        }
      }
      return filecontent;
    },
    async Report() {
      try {
        this.reporting = 'downloading ' + this.itemsSelected.length + 'messages'
        var emails = [];
        for(let i = 0; i < this.itemsSelected.length; i++) {
          var item = this.itemsSelected[i];
          let filecontent = await this.GetBody(item.id);
          if(filecontent != null && filecontent.length > 0) {
            const decoder = new TextDecoder('utf-8');
            const data = decoder.decode(filecontent);
            emails.push(data);
          } else {
            console.log("No message/data found for", item.id)
          }
        }
        if(emails.length == 0) {
          this.reporting = 'No messages to report'
          return;
        }
        this.reporting = 'Posting message to /api/email'
        // Post data to /api/email
        const response = await fetch('/api/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: this.id,
            seq: this.seq,
            emails
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
        for(let i = 0; i < this.itemsSelected.length; i++) {
          var item = this.itemsSelected[i];
          console.log("Delivering", item)
          if(item.seq == null || item.seq == "") {
            await this.Client.UpdateDocument({ collectionname: this.collectionname, query: { id: item.id }, document: { "$set": { sendingZone: "default" } } });
          } else {
            await this.Client.UpdateDocument({ collectionname: this.collectionname, query: { id: item.id, seq: item.seq }, document: { "$set": { sendingZone: "default" } } });
          }
        }
        this.GetData();
      } catch (error) {
        this.errormessage = error.message;
      }
    },
    async Delete() {
      try {
        if(this.itemsSelected.length == 0) return;
        if(this.itemsSelected.length == 1) {
          let isExecuted = confirm("Are you sure want to delete " + this.itemsSelected.length + " item?");
          if (!isExecuted) return;
        } else {
          let isExecuted = confirm("Are you sure want to delete " + this.itemsSelected.length + " items?");
          if (!isExecuted) return;
        }
        for(let i = 0; i < this.itemsSelected.length; i++) {
          var item = this.itemsSelected[i];
          console.log("Deleting", item)
          if(this.seq == null || this.seq == "") {
            await this.Client.DeleteMany({ collectionname: this.collectionname, query: { id: item.id } });
          } else {
            await this.Client.DeleteMany({ collectionname: this.collectionname, query: { id: item.id, seq: item.seq } });
          }
        }
        this.GetData();
      } catch (error) {
        this.errormessage = error.message;
      }
    },
    FocusSearch() {
      this.$refs.searchfield.focus();
    },
    async GetData() {
      if (!this.Signedin) return;
      this.loading = true
      this.cancelAutoUpdate();
      try {
        var orderby = {};
        if (this.serverOptions.sortType == "asc") {
          orderby[this.serverOptions.sortBy] = 1;
        }
        if (this.serverOptions.sortType == "desc") {
          orderby[this.serverOptions.sortBy] = -1;
        }
        var query = {};
        var exactquery = null;
        await this.PageStateSet({key: "quarantine_" + this.collectionname + "_searchValue", value: this.searchValue});
        if (this.searchValue !== "" && this.searchValue != null) {
          if (this.searchValue.indexOf("{") == 0) {
            if (this.searchValue.lastIndexOf("}") == (this.searchValue.length - 1)) {
              try {
                this.errormessage = "";
                query = this.parseJson(this.searchValue, null, null);
              } catch (error) {
                this.errormessage = error.message ? error.message : error;
              }
            }
          } else {
            let finalor = [];
            const finalexactor = [];
            for (let i = 0; i < this.searchfields.length; i++) {
              let newq = {};
              const newexactq = {};
              // exact match case sensitive
              // newq[this.searchfields[i]] = this.searchValue;
              // exact match case insensitive
              newexactq[this.searchfields[i]] = new RegExp(["^", this.searchValue, "$"].join(""), "i");
              // newexactq[this.searchfields[i]] = new RegExp(["^", this.searchValue].join(""), "i");

              // exact match string contains
              newq[this.searchfields[i]] = new RegExp([this.searchValue.substring(1)].join(""), "i");

              finalor.push(newq);
              finalexactor.push(newexactq);
            }
            var hastextindex = false;
            if (this.Config.collections_with_text_index.indexOf(this.collectionname) > -1) {
              hastextindex = true;
            }
            if (!this.searchValue.startsWith(".") && hastextindex) {
              finalor = [{ $text: { $search: this.searchValue.toLowerCase() } }]
            }
            if (Object.keys(query).length == 0) {
              query = { $or: finalor.concat() };
              exactquery = { $or: finalexactor.concat() };
            } else {
              query = { $and: [query, { $or: finalor.concat() }] };
              exactquery = { $and: [query, { $or: finalexactor.concat() }] };
            }
            if (!this.searchValue.startsWith(".") && hastextindex) {
              exactquery = { "_searchnames": this.searchValue.toLowerCase() };
            }

          }
        }
        this.headers = [
          { text: "From", value: "from", sortable: true },
          { text: "Recipient", value: "recipient", sortable: true },
          { text: "Subject", value: "subject", sortable: true },
          { text: "id", value: "id", sortable: true },
          { text: "Domain", value: "domain", sortable: true },
          { text: "Queue", value: "sendingZone", sortable: true },
          { text: "Created", value: "created", sortable: true }
          
        ]
        if(this.serverOptions.page == 1){
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_page", value: ""});
        } else {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_page", value: this.serverOptions.page});
        }
        if(this.serverOptions.rowsPerPage == 10){
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_rowsperpage", value: ""});
        } else {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_rowsperpage", value: this.serverOptions.page});
        }
        if(this.serverOptions.sortBy == "_created" && this.collectionname != "fs.files") {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_sortby", value: ""});
        } else if(this.serverOptions.sortBy == "metadata._created" && this.collectionname == "fs.files") {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_sortby", value: ""});
        } else {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_sortby", value: this.serverOptions.sortBy});
        }
        if(this.serverOptions.sortType == "desc") {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_sorttype", value: ""});
        } else {
          await this.PageStateSet({key: "quarantine_" + this.collectionname + "_sorttype", value: this.serverOptions.sortType});
        }
        
        
        if (this.collectionname != "cvr" && this.collectionname != "linkedin" && this.collectionname != "dbusage") {
          if (this.serverItemsLength == 0) {
            this.serverItemsLength = ((this.serverOptions.page - 1) * this.serverOptions.rowsPerPage) + this.serverOptions.rowsPerPage + 1;
            // this.serverItemsLength = await this.Client.Count({ query, collectionname: this.collectionname });
            this.Client.Count({ query, collectionname: this.collectionname }).then(value => {
              this.serverItemsLength = value;
            });
          }
        } else {
          // fake more items
          this.serverItemsLength = ((this.serverOptions.page - 1) * this.serverOptions.rowsPerPage) + this.serverOptions.rowsPerPage + 1;
          if (this.items.length < this.serverOptions.rowsPerPage) {
            this.serverItemsLength = ((this.serverOptions.page - 1) * this.serverOptions.rowsPerPage) + this.items.length;
          }
          if (this.serverItemsLength < 1) this.serverItemsLength = 11;
        }
        if (this.serverItemsLength > 0) {
          if (exactquery != null && this.serverOptions.page == 1) {
            var arr = (await this.Client.Query({
              query: exactquery, collectionname: this.collectionname, top: 1
            }));
            if (arr.length > 0) {
              arr = arr.concat(await this.Client.Query({
                query, collectionname: this.collectionname, top: this.serverOptions.rowsPerPage - 1, orderby
              }));
            } else {
              arr = await this.Client.Query({
                query, collectionname: this.collectionname, top: this.serverOptions.rowsPerPage, orderby
              });

            }
            this.items = arr.filter((v, i, a) => a.findIndex(v2 => (v2._id === v._id)) === i)
          } else {
            console.log(orderby)
            this.items = await this.Client.Query({
              query, collectionname: this.collectionname, top: this.serverOptions.rowsPerPage,
              skip: (this.serverOptions.page - 1) * this.serverOptions.rowsPerPage,
              orderby,
              sort: this.serverOptions.sortBy + " " + this.serverOptions.sortType
            })
            if (this.serverOptions.page == 1 && this.items.length < this.serverOptions.rowsPerPage) {
              this.serverItemsLength = this.items.length;
            }
          }
        } else {
          this.items = [];
        }
        this.lastSearchValue = this.searchValue;
      } catch (error) {
        console.error(error);
      }
      finally {
        this.addAutoUpdate();
        this.loading = false;
      }
    },
    addAutoUpdate() {
      if (this.timer == null && this.autoUpdateInterval > 0) {
        this.timer = setInterval(this.doAutoUpdate, this.autoUpdateInterval * 1000);
      }
    },
    doAutoUpdate() {
      try {
        if (this.itemsSelected == null || this.itemsSelected.length == 0) {
          this.GetData();
        } else {
          this.addAutoUpdate();
        }
      } catch (error) {
      }
    },
    cancelAutoUpdate() {
      clearInterval(this.timer);
      this.timer = null;
    },
    parseJson(txt, reviver) {
      const context = 50;
      try {
        return JSON.parse(txt, reviver)
      } catch (e) {
        if (typeof txt !== "string") {
          const isEmptyArray = Array.isArray(txt) && txt.length === 0
          const errorMessage = "Cannot parse " +
            (isEmptyArray ? "an empty array" : String(txt))
          throw new TypeError(errorMessage)
        }
        const syntaxErr = e.message.match(/^Unexpected token.*position\s+(\d+)/i)
        const errIdx = syntaxErr
          ? +syntaxErr[1]
          : e.message.match(/^Unexpected end of JSON.*/i)
            ? txt.length - 1
            : null
        if (errIdx != null) {
          const start = errIdx <= context
            ? 0
            : errIdx - context
          const end = errIdx + context >= txt.length
            ? txt.length
            : errIdx + context
          e.message += ` while parsing near "${start === 0 ? "" : "..."
            }${txt.slice(start, end)}${end === txt.length ? "" : "..."
            }"`
        } else {
          e.message += ` while parsing "${txt.slice(0, context * 2)}"`
        }
        throw e
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
    _timeToo(timeStamp) {
      const now = new Date();
      let secondsPast = (now.getTime() - timeStamp.getTime()) / 1000;
      var suffix = "";
      if (secondsPast > 0) suffix = " ago";
      if (secondsPast < 0) secondsPast *= -1

      if (secondsPast < 60) {
        return parseInt(secondsPast.toString()) + 's' + suffix;
      }
      if (secondsPast < 3600) {
        return parseInt((secondsPast / 60).toString()) + 'm' + suffix;
      }
      if (secondsPast <= 86400) {
        return parseInt((secondsPast / 3600).toString()) + 'h' + suffix;
      }
      if (secondsPast > 86400) {
        let day = timeStamp.getDate();
        let month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
        let year = timeStamp.getFullYear() == now.getFullYear() ? "" : " " + timeStamp.getFullYear();
        return day + " " + month + year;
      }
    },
  },


  name: 'QuarantineView'
}
</script>

<style scoped>
body.dark {
  filter: saturate(3);
  --easy-table-header-font-color: rgba(255, 255, 255, 0.418);
}

body.dark .easy-checkbox {
  background: var(--easy-table-header-font-color)
}

body.dark .card a {
  color: var(--easy-table-header-font-color);
}
.operation-wrapper .operation-icon {
  width: 20px;
  cursor: pointer;
}

body.dark .operation-wrapper .operation-icon {
  filter: invert(100%);
}
</style>