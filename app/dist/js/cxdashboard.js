(function(t){function a(a){for(var e,o,r=a[0],c=a[1],l=a[2],g=0,d=[];g<r.length;g++)o=r[g],Object.prototype.hasOwnProperty.call(s,o)&&s[o]&&d.push(s[o][0]),s[o]=0;for(e in c)Object.prototype.hasOwnProperty.call(c,e)&&(t[e]=c[e]);u&&u(a);while(d.length)d.shift()();return i.push.apply(i,l||[]),n()}function n(){for(var t,a=0;a<i.length;a++){for(var n=i[a],e=!0,r=1;r<n.length;r++){var c=n[r];0!==s[c]&&(e=!1)}e&&(i.splice(a--,1),t=o(o.s=n[0]))}return t}var e={},s={dashboard:0},i=[];function o(a){if(e[a])return e[a].exports;var n=e[a]={i:a,l:!1,exports:{}};return t[a].call(n.exports,n,n.exports,o),n.l=!0,n.exports}o.m=t,o.c=e,o.d=function(t,a,n){o.o(t,a)||Object.defineProperty(t,a,{enumerable:!0,get:n})},o.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},o.t=function(t,a){if(1&a&&(t=o(t)),8&a)return t;if(4&a&&"object"===typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&a&&"string"!=typeof t)for(var e in t)o.d(n,e,function(a){return t[a]}.bind(null,e));return n},o.n=function(t){var a=t&&t.__esModule?function(){return t["default"]}:function(){return t};return o.d(a,"a",a),a},o.o=function(t,a){return Object.prototype.hasOwnProperty.call(t,a)},o.p="/";var r=window["webpackJsonp"]=window["webpackJsonp"]||[],c=r.push.bind(r);r.push=a,r=r.slice();for(var l=0;l<r.length;l++)a(r[l]);var u=c;i.push([0,"cxdashboard.libs","mediawiki.ui"]),n()})({0:function(t,a,n){t.exports=n("56d7")},2395:function(t,a,n){},"46f8":function(t,a,n){"use strict";var e=n("e243"),s=n.n(e);s.a},"56d7":function(t,a,n){"use strict";n.r(a);n("d3b7"),n("ddb0"),n("e260"),n("e6cf"),n("cca6"),n("a79d");var e=n("2b0e"),s=function(){var t=this,a=t.$createElement,n=t._self._c||a;return n("div",{staticClass:"container",attrs:{id:"cxdashboard"}},[n("cx-header"),n("section",{staticClass:"row cx-translation-header"},[n("mw-button",{staticClass:"col-md-4 col-xs-12 col-lg-3 col-offset-lg-1 mb-4 mt-4",attrs:{progressive:"",large:"",icon:t.mwIconAdd,label:t.$i18n("cx-create-new-translation")}})],1),n("section",{staticClass:"row cx-translation-dashboard-container"},[n("cx-dashboard",{staticClass:"col-xs-12 col-md-8 col-lg-7 col-offset-lg-1 mb-4"})],1)],1)},i=[],o=n("f7d3"),r=function(){var t=this,a=t.$createElement,n=t._self._c||a;return n("header",{staticClass:"row cx-header"},[n("div",{staticClass:"col-6 col-xs-8 items-center justify-start"},[n("h1",{staticClass:"header ma-0 pa-0"},[n("mw-button",{attrs:{type:"text",href:t.currentPageURL,icon:t.mwIconWikipediaLogo,"icon-size":32,label:t.$i18n("cx-dashboard-header")}})],1)]),n("div",{staticClass:"col-6 col-xs-4 items-center justify-end"},[n("mw-button",{staticClass:"d-xs-only-none d-sm-only-none",attrs:{type:"icon",large:"",icon:t.mwIconBell}}),n("mw-button",{staticClass:"d-xs-only-none d-sm-only-none",attrs:{type:"icon",large:"",icon:t.mwIconTray}}),n("mw-button",{staticClass:"d-xs-only-none d-sm-only-none",attrs:{type:"text",large:"",outlined:"",icon:t.mwIconUserAvatar,label:t.username,indicatorSize:18,indicator:t.mwIconExpand}}),n("mw-button",{staticClass:"d-xs-only-flex d-sm-only-flex d-none me-5",attrs:{type:"icon","icon-size":32,icon:t.mwIconUserAvatar}})],1)])},c=[],l=n("4cf1"),u={name:"cx-header",components:{MwButton:o["a"]},data:function(){return{mwIconWikipediaLogo:l["n"],mwIconBell:l["d"],mwIconTray:l["l"],mwIconExpand:l["f"],mwIconUserAvatar:l["m"]}},computed:{username:function(){return mw.user.getName()},currentPageURL:function(){return"./"+mw.config.get("wgPageName")}}},g=u,d=(n("7275"),n("2877")),f=Object(d["a"])(g,r,c,!1,null,null,null),m=f.exports,p=function(){var t=this,a=t.$createElement,n=t._self._c||a;return n("main",{staticClass:"cx-translation-dashboard"},[n("nav",{staticClass:"d-xs-only-none d-sm-only-none"},[n("mw-button-group",{attrs:{items:t.listSelector,active:t.active},on:{select:function(a){t.active=a}}})],1),n("cx-suggestion-list",{staticClass:"col-12 pa-0 ma-0",attrs:{sourceLanguage:t.sourceLanguage,targetLanguage:t.targetLanguage,active:"suggestions"===t.active}}),n("cx-translation-list",{staticClass:"col-12 pa-0 ma-0",attrs:{sourceLanguage:t.sourceLanguage,targetLanguage:t.targetLanguage,translationStatus:"published",active:"published"===t.active}}),n("cx-translation-list",{staticClass:"col-12 pa-0 ma-0",attrs:{sourceLanguage:t.sourceLanguage,targetLanguage:t.targetLanguage,translationStatus:"draft",active:"draft"===t.active}}),n("mw-bottom-navigation",{staticClass:"d-xs-only-flex d-sm-only-flex d-none"},[n("mw-button-group",{attrs:{items:t.listSelector,active:t.active},on:{select:function(a){t.active=a}}})],1)],1)},h=[],w=function(){var t=this,a=t.$createElement,n=t._self._c||a;return n("mw-card",{directives:[{name:"show",rawName:"v-show",value:t.active,expression:"active"}],class:"cx-translation-list--"+t.translationStatus,attrs:{title:t.$i18n("cx-translation-label-"+t.translationStatus)}},[t.loaded?t._e():n("mw-spinner"),t._l(t.translations,(function(a,e){return n("div",{key:t.translationStatus+"-"+e,staticClass:"row pa-0 ma-0"},[n("cx-translation-work",{staticClass:"col-12 pa-0 ma-0",attrs:{translation:a.translation}})],1)}))],2)},v=[],b=(n("c975"),n("5e62")),x=function(){var t=this,a=t.$createElement,n=t._self._c||a;return t.translation?n("div",{directives:[{name:"show",rawName:"v-show",value:t.translation,expression:"translation"}],staticClass:"row cx-translation pa-4",on:{click:t.handleClick}},[n("div",{staticClass:"col-2 pa-2"},[n("mw-thumbnail",{attrs:{thumbnail:t.getImage(t.translation.sourceLanguage,t.translation.sourceTitle)}})],1),n("div",{staticClass:"col-9 pa-2"},[n("div",{staticClass:"row"},[n("span",{staticClass:"col-12 cx-translation__source-title",attrs:{lang:t.translation.sourceLanguage}},[t._v(t._s(t.translation.sourceTitle))]),n("span",{staticClass:"col-12 cx-translation__target-title",attrs:{lang:t.translation.targetLanguage}},[t._v(t._s(t.translation.targetTitle))]),n("span",{staticClass:"col-12 mt-2 cx-translation__languages text-small"},[n("mw-autonym",{attrs:{lang:t.translation.sourceLanguage}}),n("mw-icon",{attrs:{icon:t.mwIconArrowForward}}),n("mw-autonym",{attrs:{lang:t.translation.targetLanguage}})],1)])]),n("div",{staticClass:"col-1 pa-2"},[n("mw-icon",{attrs:{size:24,icon:"published"===t.translation.status?t.mwIconEdit:t.mwIconTrash}})],1)]):t._e()},y=[],C=n("f3f3"),I=n("3592"),L=n("5872"),_=n("23cb"),S=n("2f62"),T={name:"cx-translation-work",data:function(){return{mwIconEdit:l["e"],mwIconTrash:l["k"],mwIconArrowForward:l["b"]}},props:{translation:{type:Object,required:!0}},components:{MwThumbnail:I["a"],MwAutonym:_["a"],MwIcon:L["a"]},computed:Object(C["a"])({},Object(S["b"])({articles:function(t){return t.mediawiki.articles}})),methods:{handleClick:function(t){this.$emit("click",t)},getMetadata:function(t,a){return this.$store.getters["mediawiki/getMetadata"](t,a)},getImage:function(t,a){var n=this.getMetadata(t,a);return n&&n.thumbnail}}},j=T,k=(n("69ee"),Object(d["a"])(j,x,y,!1,null,null,null)),M=k.exports,O=n("3d5e"),$={name:"cx-translation-list",components:{CxTranslationWork:M,MwCard:b["a"],MwSpinner:O["a"]},props:{active:{type:Boolean,default:!1},translationStatus:{type:String,validator:function(t){return-1!==["published","draft"].indexOf(t)}},sourceLanguage:{type:String,default:"en"},targetLangauge:{type:String}},data:function(){return{loaded:!1}},computed:{translations:function(){return"published"===this.translationStatus?this.$store.state.translator.publishedTranslations:this.$store.state.translator.draftTranslations}},watch:{translations:function(){this.loaded=!0}}},P=$,A=Object(d["a"])(P,w,v,!1,null,null,null),E=A.exports,F=function(){var t=this,a=t.$createElement,n=t._self._c||a;return n("div",{directives:[{name:"show",rawName:"v-show",value:t.active,expression:"active"}]},[n("mw-card",{staticClass:"cx-translation-list--suggestions",attrs:{title:t.$i18n("cx-suggestionlist-title")}},[t.loaded?t._e():n("mw-spinner"),t._l(t.suggestionsForPairSubset,(function(a,e){return n("div",{key:"suggestion-"+e,staticClass:"row pa-0 ma-0"},[n("cx-translation-suggestion",{staticClass:"col-12 pa-0 ma-0",attrs:{suggestion:a,from:t.sourceLanguage,to:t.targetLanguage}})],1)}))],2),t.loaded?n("mw-button",{attrs:{block:!0,label:t.$i18n("cx-suggestionlist-refresh"),outlined:!1,icon:t.mwIconRefresh},on:{click:t.reloadSuggestions}}):t._e()],1)},B=[],U=(n("99af"),n("fb6a"),function(){var t=this,a=t.$createElement,n=t._self._c||a;return n("div",{staticClass:"row cx-suggestion pa-4",attrs:{if:t.suggestion},on:{click:t.handleClick}},[n("div",{staticClass:"col-2 pa-2"},[n("mw-thumbnail",{attrs:{thumbnail:t.thumbnail}})],1),n("div",{staticClass:"col-9 pa-2"},[n("div",{staticClass:"row ma-0",attrs:{if:t.suggestion}},[n("span",{staticClass:"col-12 cx-suggestion__source-title",attrs:{lang:t.from}},[t._v(t._s(t.displayTitle))]),n("span",{staticClass:"col-12 cx-suggestion__source-description",attrs:{lang:t.from}},[t._v(t._s(t.description))]),n("span",{staticClass:"col-12 mt-2 cx-suggestion__languages text-small"},[n("mw-autonym",{attrs:{lang:t.from}}),t._v(" "),n("mw-icon",{attrs:{icon:t.mwIconArrowForward}}),n("mw-autonym",{attrs:{lang:t.to}})],1)])]),n("div",{staticClass:"col-1 pa-2"},[n("mw-icon",{attrs:{icon:t.mwIconStar,size:24}})],1)])}),q=[],N=(n("a4d3"),n("e01a"),n("ac1f"),n("5319"),{name:"TranslationSuggestion",data:function(){return{mwIconStar:l["j"],mwIconArrowForward:l["b"]}},props:{suggestion:{type:Object,default:null},from:{type:String,default:null},to:{type:String,default:null}},components:{MwThumbnail:I["a"],MwAutonym:_["a"],MwIcon:L["a"]},computed:{description:function(){return this.metadata&&this.metadata.description},thumbnail:function(){return this.metadata&&this.metadata.thumbnail},metadata:function(){return this.$store.getters["mediawiki/getMetadata"](this.from,this.displayTitle)},displayTitle:function(){return this.suggestion.title.replace(/_/g," ")}},methods:{handleClick:function(t){this.$emit("click",t)},autonym:function(t){return languagedata.getAutonym(t)}}}),z=N,R=(n("46f8"),Object(d["a"])(z,U,q,!1,null,null,null)),D=R.exports,W={name:"cx-translation-list",components:{CxTranslationSuggestion:D,MwCard:b["a"],MwButton:o["a"],MwSpinner:O["a"]},props:{active:{type:Boolean,default:!1},sourceLanguage:{type:String,default:"en"},targetLanguage:{type:String}},data:function(){return{mwIconRefresh:l["i"],loaded:!1,startIndex:0,endIndex:3}},computed:Object(C["a"])({},Object(S["b"])({suggestions:function(t){return t.suggestions.suggestions}}),{suggestionsForPair:function(){var t,a="".concat(this.sourceLanguage,"/").concat(this.targetLanguage),n=null===(t=this.suggestions[a])||void 0===t?void 0:t.suggestions;return n||[]},suggestionsForPairSubset:function(){return this.suggestionsForPair.slice(this.startIndex,this.endIndex)}}),watch:{suggestions:function(){this.loaded=!0}},methods:{reloadSuggestions:function(){this.startIndex+=this.endIndex,this.endIndex+=this.endIndex,this.suggestionsForPair.length<=this.startIndex&&(this.startIndex=0,this.endIndex=3)}},created:function(){this.$store.dispatch("suggestions/getSuggestions",{from:this.sourceLanguage,to:this.targetLanguage})}},J=W,G=Object(d["a"])(J,F,B,!1,null,null,null),H=G.exports,X=n("b1ab"),K=n("703d"),Q={name:"cx-dashboard",components:{CxSuggestionList:H,CxTranslationList:E,MwButtonGroup:X["a"],MwBottomNavigation:K["a"]},data:function(){return{mwIconArticleCheck:l["c"],mwIconLightBulb:l["h"],mwIconEdit:l["e"],suggestionsLoaded:!1,publishedTranslationsLoaded:!1,draftTranslationsLoaded:!1,active:"draft",sourceLanguage:"en",targetLanguage:"ml"}},computed:{listSelector:function(){return[{value:"suggestions",props:{label:this.$i18n("cx-translation-filter-suggested-translations"),icon:l["h"],type:"text"}},{value:"draft",props:{label:this.$i18n("cx-translation-filter-draft-translations"),icon:l["e"],type:"text"}},{value:"published",props:{label:this.$i18n("cx-translation-filter-published-translations"),icon:l["c"],type:"text"}}]}},watch:{active:function(){window.scrollTo(0,0)}},created:function(){this.$store.dispatch("translator/init"),this.$store.dispatch("mediawiki/fetchLanguageInfo")}},V=Q,Y=Object(d["a"])(V,p,h,!1,null,null,null),Z=Y.exports,tt=(n("5c26"),{name:"cx-dashboard-app",components:{MwButton:o["a"],CxHeader:m,CxDashboard:Z},data:function(){return{mwIconAdd:l["a"]}}}),at=tt,nt=(n("7c55"),Object(d["a"])(at,s,i,!1,null,null,null)),et=nt.exports,st=n("bc3a"),it=n.n(st);function ot(t){var a={action:"query",format:"json",assert:"user",formatversion:2,list:"contenttranslation",type:t},n=mw.util.wikiScript("api");return it()({method:"get",url:n,api:n,params:a,withCredentials:!0}).then((function(t){return t.data.query.contenttranslation.translations}))}function rt(){return ot("published")}function ct(){return ot("draft")}var lt={fetchDraftTranslations:ct,fetchPublishedTranslations:rt},ut={username:mw.config.get("wgUserName"),publishedTranslations:[],draftTranslations:[],savedForLaterTranslations:[]},gt={setPublishedTranslations:function(t,a){t.publishedTranslations=a},setDraftTranslations:function(t,a){t.draftTranslations=a}},dt={},ft={init:function(t){var a=t.dispatch;a("publishedTranslations"),a("draftTranslations")},publishedTranslations:function(t){var a=t.commit,n=t.dispatch;lt.fetchPublishedTranslations().then((function(t){a("setPublishedTranslations",t);for(var e=0;e<t.length;e++)n("mediawiki/fetchMetadata",{language:t[e].translation.sourceLanguage,titles:[t[e].translation.sourceTitle]},{root:!0})}))},draftTranslations:function(t){var a=t.commit,n=t.dispatch;lt.fetchDraftTranslations().then((function(t){a("setDraftTranslations",t);for(var e=0;e<t.length;e++)n("mediawiki/fetchMetadata",{language:t[e].translation.sourceLanguage,titles:[t[e].translation.sourceTitle]},{root:!0})}))}},mt={namespaced:!0,state:ut,getters:dt,actions:ft,mutations:gt},pt=n("fc11");function ht(t,a,n){var e={source:t,target:a,seed:n,search:"related_articles",application:"CX"},s=mw.config.get("wgRecommendToolAPIURL");return it.a.get(s,{params:e}).then((function(t){return t.data}))}var wt={fetchSuggestions:ht},vt={suggestions:{},favorites:{}},bt={setSuggestions:function(t,a){var n="".concat(a.from,"/").concat(a.to);t.suggestions=Object(C["a"])({},t.suggestions,Object(pt["a"])({},n,a))}},xt={},yt={getSuggestions:function(t,a){var n=t.commit,e=t.dispatch;wt.fetchSuggestions(a.from,a.to,a.seeds).then((function(t){var s=[];n("setSuggestions",{from:a.from,to:a.to,suggestions:t});for(var i=0;i<t.length;i++)s.push(t[i].title);e("mediawiki/fetchMetadata",{language:a.from,titles:s},{root:!0})}))}},Ct={namespaced:!0,state:vt,getters:xt,actions:yt,mutations:bt};n("a15b");function It(t,a){var n={action:"query",format:"json",formatversion:2,prop:"info|pageprops|pageimages|description|pageviews",pvipdays:7,piprop:"thumbnail|name|original",pithumbsize:100,titles:a.join("|"),origin:"*"},e="https://".concat(t,".wikipedia.org/w/api.php");return it.a.get(e,{params:n}).then((function(t){return t.data.query.pages}))}var Lt={fetchMetadata:It};function _t(t){var a={action:"query",format:"json",formatversion:2,meta:"languageinfo",liprop:"autonym|dir",origin:"*"};return t&&(a["licontinue"]=t),it.a.get(mw.util.wikiScript("api"),{params:a}).then((function(t){var a,n=null===(a=t.data.continue)||void 0===a?void 0:a.licontinue,e=t.data.query.languageinfo;return n&&(e=Object.assign({},e,_t(n))),e}))}var St={fetchLanguageInfo:_t},Tt={articles:{},languageInfo:{}},jt={addArticleMetadata:function(t,a){var n="".concat(a.pagelanguage,"/").concat(a.title);t.articles=Object(C["a"])({},t.articles,Object(pt["a"])({},n,a))},setLanguageInfo:function(t,a){t.languageInfo=a}},kt={getMetadata:function(t){return function(a,n){var e="".concat(a,"/").concat(n);return t.articles[e]}}},Mt={fetchMetadata:function(t,a){var n=t.commit;Lt.fetchMetadata(a.language,a.titles).then((function(t){for(var a=0;a<t.length;a++)n("addArticleMetadata",t[a])}))},fetchLanguageInfo:function(t,a){var n=t.commit;St.fetchLanguageInfo().then((function(t){n("setLanguageInfo",t)}))}},Ot={namespaced:!0,state:Tt,getters:kt,actions:Mt,mutations:jt};e["a"].use(S["a"]);var $t=new S["a"].Store({modules:{translator:mt,suggestions:Ct,mediawiki:Ot}}),Pt=n("5093"),At=n.n(Pt),Et=mw.config.get("wgUserLanguage"),Ft="en",Bt=mw.messages.values||{};e["a"].use(At.a,{locale:Et,finalFallback:Ft,messages:Bt}),new e["a"]({store:$t,render:function(t){return t(et)},el:"#cxdashboard"})},"69ee":function(t,a,n){"use strict";var e=n("7b46"),s=n.n(e);s.a},7275:function(t,a,n){"use strict";var e=n("a2f6"),s=n.n(e);s.a},"7b46":function(t,a,n){},"7c55":function(t,a,n){"use strict";var e=n("2395"),s=n.n(e);s.a},a2f6:function(t,a,n){},e243:function(t,a,n){}});
//# sourceMappingURL=cxdashboard.js.map