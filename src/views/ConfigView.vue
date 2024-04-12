<template>

  <div v-if="errormessage" class="row">
    <div class="col">
      <div class="card">
        <h1 class="text-error">{{ errormessage }}</h1>
      </div>
    </div>
  </div>
  <div class="row" v-if="!errormessage">
    <div class="col">
      <button type="button" class="button primary col-3" v-on:click="Save">Save</button>
    </div>
  </div>


  <section>
    <div class="row">
      <div class="col">
        name
      </div>
      <div class="col">
        <editableTextField v-model="item.name" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        Auto trust if first email is not spam
      </div>
      <div class="col">
        <editableTextField v-model="item.auto_trust_firsttime_notspam" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        Auto block all email if first email is spam
      </div>
      <div class="col">
        <editableTextField v-model="item.auto_deny_firsttime_spammers" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        Quarantine spam email ( If not it will be deleted and cannot be recovered)
      </div>
      <div class="col">
        <editableTextField v-model="item.auto_deny_firsttime_spammers" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        LLM prompt
      </div>
      <div class="col">
        <editableTextField v-model="item.prompt" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        domains ( allow relaying for these domains )
      </div>
      <div class="col">
        <editableTextField v-model="item.domains" />
      </div>
    </div>
    <div class="row">
      <div class="col">
        emails ( to limit relaying for specefic emails, use this field instead of domains )
      </div>
      <div class="col">
        <editableTextField v-model="item.emails" />
      </div>
    </div>
  </section>



  <div class="row"  v-if="!errormessage">
    <div class="col">
      <button type="button" class="button primary col-3" v-on:click="Save">Save</button>
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
      meta: {},
      errormessage: '',
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
      return this.meta.headers?.map(x => x.line).join('\n') || 'No headers available';
    },
    bodyContent() {
      console.log("bodyContent");
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
    Back() {
      console.log("Back")
      this.$router.push({ name: 'Configs' });
    },
    async GetData() {
      this.collectionname = "mailconfig";
      this.item.name = "new item";
      console.log("GetData", this.seq)
      if (this.Signedin == true && !Util.IsNullEmpty(this.id)) {
        var results = await this.Client.Query({ collectionname: this.collectionname, query: { _id: this.id }, top: 1 });
        console.log("results", results)
        if (results.length == 0) {
          this.errormessage = "Item not found"
          return;
        }
        this.item = results[0];
      }
    },
    async Save(e) {
      if (e != null) {
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        e.returnValue = 'Really want to quit the game?';
      }
      var item = { ...this.item };
      if (this.mode == "json") var item = JSON.parse(this.json);
      try {
        if (!Util.IsNullEmpty(this.id)) {
          await this.Client.UpdateOne({ collectionname: this.collectionname, item });
        } else {
          await this.Client.InsertOne({ collectionname: this.collectionname, item });
        }
        if (e != null) {
          setTimeout(() => {
            this.$router.push({ name: 'Configs' });
          }, 200)
        } else {
          this.$router.push({ name: 'Configs' });
        }

      } catch (error) {
        this.errormessage = error
      }
      return false;
    }
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
