var we=Object.defineProperty;var qe=(a,e,i)=>e in a?we(a,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):a[e]=i;var f=(a,e,i)=>qe(a,typeof e!="symbol"?e+"":e,i);import{c as ze,a4 as I,j as u,f as V,i as B,F as Ie,B as re,aX as oe,a6 as Te,V as je,g as ce,h as le,a8 as De,cR as de,cf as Me,U as $e,M as Ne,aj as Le}from"./index-BKCBrrzQ.js";import Ge from"./purify.es-BFmuJLeH.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=ze("Hash",[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]]);function Q(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var R=Q();function fe(a){R=a}var q={exec:()=>null};function h(a,e=""){let i=typeof a=="string"?a:a.source,t={replace:(s,r)=>{let d=typeof r=="string"?r:r.source;return d=d.replace(x.caret,"$1"),i=i.replace(s,d),t},getRegex:()=>new RegExp(i,e)};return t}var x={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:a=>new RegExp(`^( {0,3}${a})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:a=>new RegExp(`^ {0,${Math.min(3,a-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:a=>new RegExp(`^ {0,${Math.min(3,a-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:a=>new RegExp(`^ {0,${Math.min(3,a-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:a=>new RegExp(`^ {0,${Math.min(3,a-1)}}#`),htmlBeginRegex:a=>new RegExp(`^ {0,${Math.min(3,a-1)}}<(?:[a-z].*>|!--)`,"i")},Ve=/^(?:[ \t]*(?:\n|$))+/,Be=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,_e=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,z=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,He=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Z=/(?:[*+-]|\d{1,9}[.)])/,ve=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,be=h(ve).replace(/bull/g,Z).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),Oe=h(ve).replace(/bull/g,Z).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),W=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Ue=/^[^\n]+/,J=/(?!\s*\])(?:\\.|[^\[\]\\])+/,Qe=h(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",J).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),Ze=h(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,Z).getRegex(),N="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",X=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,We=h("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",X).replace("tag",N).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),xe=h(W).replace("hr",z).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",N).getRegex(),Je=h(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",xe).getRegex(),K={blockquote:Je,code:Be,def:Qe,fences:_e,heading:He,hr:z,html:We,lheading:be,list:Ze,newline:Ve,paragraph:xe,table:q,text:Ue},pe=h("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",z).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",N).getRegex(),Xe={...K,lheading:Oe,table:pe,paragraph:h(W).replace("hr",z).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",pe).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",N).getRegex()},Ke={...K,html:h(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",X).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:q,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:h(W).replace("hr",z).replace("heading",` *#{1,6} *[^
]`).replace("lheading",be).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Ye=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,ea=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,ke=/^( {2,}|\\)\n(?!\s*$)/,aa=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,L=/[\p{P}\p{S}]/u,Y=/[\s\p{P}\p{S}]/u,ye=/[^\s\p{P}\p{S}]/u,ia=h(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,Y).getRegex(),Ce=/(?!~)[\p{P}\p{S}]/u,sa=/(?!~)[\s\p{P}\p{S}]/u,ta=/(?:[^\s\p{P}\p{S}]|~)/u,na=/\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<(?! )[^<>]*?>/g,Pe=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,ra=h(Pe,"u").replace(/punct/g,L).getRegex(),oa=h(Pe,"u").replace(/punct/g,Ce).getRegex(),Ae="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",ca=h(Ae,"gu").replace(/notPunctSpace/g,ye).replace(/punctSpace/g,Y).replace(/punct/g,L).getRegex(),la=h(Ae,"gu").replace(/notPunctSpace/g,ta).replace(/punctSpace/g,sa).replace(/punct/g,Ce).getRegex(),da=h("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,ye).replace(/punctSpace/g,Y).replace(/punct/g,L).getRegex(),pa=h(/\\(punct)/,"gu").replace(/punct/g,L).getRegex(),ua=h(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),ma=h(X).replace("(?:-->|$)","-->").getRegex(),ha=h("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",ma).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),D=/(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/,ga=h(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",D).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Re=h(/^!?\[(label)\]\[(ref)\]/).replace("label",D).replace("ref",J).getRegex(),Ee=h(/^!?\[(ref)\](?:\[\])?/).replace("ref",J).getRegex(),fa=h("reflink|nolink(?!\\()","g").replace("reflink",Re).replace("nolink",Ee).getRegex(),ee={_backpedal:q,anyPunctuation:pa,autolink:ua,blockSkip:na,br:ke,code:ea,del:q,emStrongLDelim:ra,emStrongRDelimAst:ca,emStrongRDelimUnd:da,escape:Ye,link:ga,nolink:Ee,punctuation:ia,reflink:Re,reflinkSearch:fa,tag:ha,text:aa,url:q},va={...ee,link:h(/^!?\[(label)\]\((.*?)\)/).replace("label",D).getRegex(),reflink:h(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",D).getRegex()},H={...ee,emStrongRDelimAst:la,emStrongLDelim:oa,url:h(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,"i").replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,text:/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/},ba={...H,br:h(ke).replace("{2,}","*").getRegex(),text:h(H.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},T={normal:K,gfm:Xe,pedantic:Ke},S={normal:ee,gfm:H,breaks:ba,pedantic:va},xa={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ue=a=>xa[a];function y(a,e){if(e){if(x.escapeTest.test(a))return a.replace(x.escapeReplace,ue)}else if(x.escapeTestNoEncode.test(a))return a.replace(x.escapeReplaceNoEncode,ue);return a}function me(a){try{a=encodeURI(a).replace(x.percentDecode,"%")}catch{return null}return a}function he(a,e){var r;let i=a.replace(x.findPipe,(d,n,l)=>{let o=!1,c=n;for(;--c>=0&&l[c]==="\\";)o=!o;return o?"|":" |"}),t=i.split(x.splitPipe),s=0;if(t[0].trim()||t.shift(),t.length>0&&!((r=t.at(-1))!=null&&r.trim())&&t.pop(),e)if(t.length>e)t.splice(e);else for(;t.length<e;)t.push("");for(;s<t.length;s++)t[s]=t[s].trim().replace(x.slashPipe,"|");return t}function w(a,e,i){let t=a.length;if(t===0)return"";let s=0;for(;s<t;){let r=a.charAt(t-s-1);if(r===e&&!i)s++;else if(r!==e&&i)s++;else break}return a.slice(0,t-s)}function ka(a,e){if(a.indexOf(e[1])===-1)return-1;let i=0;for(let t=0;t<a.length;t++)if(a[t]==="\\")t++;else if(a[t]===e[0])i++;else if(a[t]===e[1]&&(i--,i<0))return t;return i>0?-2:-1}function ge(a,e,i,t,s){let r=e.href,d=e.title||null,n=a[1].replace(s.other.outputLinkReplace,"$1");t.state.inLink=!0;let l={type:a[0].charAt(0)==="!"?"image":"link",raw:i,href:r,title:d,text:n,tokens:t.inlineTokens(n)};return t.state.inLink=!1,l}function ya(a,e,i){let t=a.match(i.other.indentCodeCompensation);if(t===null)return e;let s=t[1];return e.split(`
`).map(r=>{let d=r.match(i.other.beginningSpace);if(d===null)return r;let[n]=d;return n.length>=s.length?r.slice(s.length):r}).join(`
`)}var M=class{constructor(a){f(this,"options");f(this,"rules");f(this,"lexer");this.options=a||R}space(a){let e=this.rules.block.newline.exec(a);if(e&&e[0].length>0)return{type:"space",raw:e[0]}}code(a){let e=this.rules.block.code.exec(a);if(e){let i=e[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:e[0],codeBlockStyle:"indented",text:this.options.pedantic?i:w(i,`
`)}}}fences(a){let e=this.rules.block.fences.exec(a);if(e){let i=e[0],t=ya(i,e[3]||"",this.rules);return{type:"code",raw:i,lang:e[2]?e[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):e[2],text:t}}}heading(a){let e=this.rules.block.heading.exec(a);if(e){let i=e[2].trim();if(this.rules.other.endingHash.test(i)){let t=w(i,"#");(this.options.pedantic||!t||this.rules.other.endingSpaceChar.test(t))&&(i=t.trim())}return{type:"heading",raw:e[0],depth:e[1].length,text:i,tokens:this.lexer.inline(i)}}}hr(a){let e=this.rules.block.hr.exec(a);if(e)return{type:"hr",raw:w(e[0],`
`)}}blockquote(a){let e=this.rules.block.blockquote.exec(a);if(e){let i=w(e[0],`
`).split(`
`),t="",s="",r=[];for(;i.length>0;){let d=!1,n=[],l;for(l=0;l<i.length;l++)if(this.rules.other.blockquoteStart.test(i[l]))n.push(i[l]),d=!0;else if(!d)n.push(i[l]);else break;i=i.slice(l);let o=n.join(`
`),c=o.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");t=t?`${t}
${o}`:o,s=s?`${s}
${c}`:c;let m=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(c,r,!0),this.lexer.state.top=m,i.length===0)break;let p=r.at(-1);if((p==null?void 0:p.type)==="code")break;if((p==null?void 0:p.type)==="blockquote"){let b=p,v=b.raw+`
`+i.join(`
`),k=this.blockquote(v);r[r.length-1]=k,t=t.substring(0,t.length-b.raw.length)+k.raw,s=s.substring(0,s.length-b.text.length)+k.text;break}else if((p==null?void 0:p.type)==="list"){let b=p,v=b.raw+`
`+i.join(`
`),k=this.list(v);r[r.length-1]=k,t=t.substring(0,t.length-p.raw.length)+k.raw,s=s.substring(0,s.length-b.raw.length)+k.raw,i=v.substring(r.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:t,tokens:r,text:s}}}list(a){let e=this.rules.block.list.exec(a);if(e){let i=e[1].trim(),t=i.length>1,s={type:"list",raw:"",ordered:t,start:t?+i.slice(0,-1):"",loose:!1,items:[]};i=t?`\\d{1,9}\\${i.slice(-1)}`:`\\${i}`,this.options.pedantic&&(i=t?i:"[*+-]");let r=this.rules.other.listItemRegex(i),d=!1;for(;a;){let l=!1,o="",c="";if(!(e=r.exec(a))||this.rules.block.hr.test(a))break;o=e[0],a=a.substring(o.length);let m=e[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,G=>" ".repeat(3*G.length)),p=a.split(`
`,1)[0],b=!m.trim(),v=0;if(this.options.pedantic?(v=2,c=m.trimStart()):b?v=e[1].length+1:(v=e[2].search(this.rules.other.nonSpaceChar),v=v>4?1:v,c=m.slice(v),v+=e[1].length),b&&this.rules.other.blankLine.test(p)&&(o+=p+`
`,a=a.substring(p.length+1),l=!0),!l){let G=this.rules.other.nextBulletRegex(v),se=this.rules.other.hrRegex(v),te=this.rules.other.fencesBeginRegex(v),ne=this.rules.other.headingBeginRegex(v),Se=this.rules.other.htmlBeginRegex(v);for(;a;){let F=a.split(`
`,1)[0],E;if(p=F,this.options.pedantic?(p=p.replace(this.rules.other.listReplaceNesting,"  "),E=p):E=p.replace(this.rules.other.tabCharGlobal,"    "),te.test(p)||ne.test(p)||Se.test(p)||G.test(p)||se.test(p))break;if(E.search(this.rules.other.nonSpaceChar)>=v||!p.trim())c+=`
`+E.slice(v);else{if(b||m.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||te.test(m)||ne.test(m)||se.test(m))break;c+=`
`+p}!b&&!p.trim()&&(b=!0),o+=F+`
`,a=a.substring(F.length+1),m=E.slice(v)}}s.loose||(d?s.loose=!0:this.rules.other.doubleBlankLine.test(o)&&(d=!0));let k=null,ie;this.options.gfm&&(k=this.rules.other.listIsTask.exec(c),k&&(ie=k[0]!=="[ ] ",c=c.replace(this.rules.other.listReplaceTask,""))),s.items.push({type:"list_item",raw:o,task:!!k,checked:ie,loose:!1,text:c,tokens:[]}),s.raw+=o}let n=s.items.at(-1);if(n)n.raw=n.raw.trimEnd(),n.text=n.text.trimEnd();else return;s.raw=s.raw.trimEnd();for(let l=0;l<s.items.length;l++)if(this.lexer.state.top=!1,s.items[l].tokens=this.lexer.blockTokens(s.items[l].text,[]),!s.loose){let o=s.items[l].tokens.filter(m=>m.type==="space"),c=o.length>0&&o.some(m=>this.rules.other.anyLine.test(m.raw));s.loose=c}if(s.loose)for(let l=0;l<s.items.length;l++)s.items[l].loose=!0;return s}}html(a){let e=this.rules.block.html.exec(a);if(e)return{type:"html",block:!0,raw:e[0],pre:e[1]==="pre"||e[1]==="script"||e[1]==="style",text:e[0]}}def(a){let e=this.rules.block.def.exec(a);if(e){let i=e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),t=e[2]?e[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",s=e[3]?e[3].substring(1,e[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):e[3];return{type:"def",tag:i,raw:e[0],href:t,title:s}}}table(a){var d;let e=this.rules.block.table.exec(a);if(!e||!this.rules.other.tableDelimiter.test(e[2]))return;let i=he(e[1]),t=e[2].replace(this.rules.other.tableAlignChars,"").split("|"),s=(d=e[3])!=null&&d.trim()?e[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],r={type:"table",raw:e[0],header:[],align:[],rows:[]};if(i.length===t.length){for(let n of t)this.rules.other.tableAlignRight.test(n)?r.align.push("right"):this.rules.other.tableAlignCenter.test(n)?r.align.push("center"):this.rules.other.tableAlignLeft.test(n)?r.align.push("left"):r.align.push(null);for(let n=0;n<i.length;n++)r.header.push({text:i[n],tokens:this.lexer.inline(i[n]),header:!0,align:r.align[n]});for(let n of s)r.rows.push(he(n,r.header.length).map((l,o)=>({text:l,tokens:this.lexer.inline(l),header:!1,align:r.align[o]})));return r}}lheading(a){let e=this.rules.block.lheading.exec(a);if(e)return{type:"heading",raw:e[0],depth:e[2].charAt(0)==="="?1:2,text:e[1],tokens:this.lexer.inline(e[1])}}paragraph(a){let e=this.rules.block.paragraph.exec(a);if(e){let i=e[1].charAt(e[1].length-1)===`
`?e[1].slice(0,-1):e[1];return{type:"paragraph",raw:e[0],text:i,tokens:this.lexer.inline(i)}}}text(a){let e=this.rules.block.text.exec(a);if(e)return{type:"text",raw:e[0],text:e[0],tokens:this.lexer.inline(e[0])}}escape(a){let e=this.rules.inline.escape.exec(a);if(e)return{type:"escape",raw:e[0],text:e[1]}}tag(a){let e=this.rules.inline.tag.exec(a);if(e)return!this.lexer.state.inLink&&this.rules.other.startATag.test(e[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(e[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(e[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(e[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:e[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:e[0]}}link(a){let e=this.rules.inline.link.exec(a);if(e){let i=e[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(i)){if(!this.rules.other.endAngleBracket.test(i))return;let r=w(i.slice(0,-1),"\\");if((i.length-r.length)%2===0)return}else{let r=ka(e[2],"()");if(r===-2)return;if(r>-1){let d=(e[0].indexOf("!")===0?5:4)+e[1].length+r;e[2]=e[2].substring(0,r),e[0]=e[0].substring(0,d).trim(),e[3]=""}}let t=e[2],s="";if(this.options.pedantic){let r=this.rules.other.pedanticHrefTitle.exec(t);r&&(t=r[1],s=r[3])}else s=e[3]?e[3].slice(1,-1):"";return t=t.trim(),this.rules.other.startAngleBracket.test(t)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(i)?t=t.slice(1):t=t.slice(1,-1)),ge(e,{href:t&&t.replace(this.rules.inline.anyPunctuation,"$1"),title:s&&s.replace(this.rules.inline.anyPunctuation,"$1")},e[0],this.lexer,this.rules)}}reflink(a,e){let i;if((i=this.rules.inline.reflink.exec(a))||(i=this.rules.inline.nolink.exec(a))){let t=(i[2]||i[1]).replace(this.rules.other.multipleSpaceGlobal," "),s=e[t.toLowerCase()];if(!s){let r=i[0].charAt(0);return{type:"text",raw:r,text:r}}return ge(i,s,i[0],this.lexer,this.rules)}}emStrong(a,e,i=""){let t=this.rules.inline.emStrongLDelim.exec(a);if(!(!t||t[3]&&i.match(this.rules.other.unicodeAlphaNumeric))&&(!(t[1]||t[2])||!i||this.rules.inline.punctuation.exec(i))){let s=[...t[0]].length-1,r,d,n=s,l=0,o=t[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(o.lastIndex=0,e=e.slice(-1*a.length+s);(t=o.exec(e))!=null;){if(r=t[1]||t[2]||t[3]||t[4]||t[5]||t[6],!r)continue;if(d=[...r].length,t[3]||t[4]){n+=d;continue}else if((t[5]||t[6])&&s%3&&!((s+d)%3)){l+=d;continue}if(n-=d,n>0)continue;d=Math.min(d,d+n+l);let c=[...t[0]][0].length,m=a.slice(0,s+t.index+c+d);if(Math.min(s,d)%2){let b=m.slice(1,-1);return{type:"em",raw:m,text:b,tokens:this.lexer.inlineTokens(b)}}let p=m.slice(2,-2);return{type:"strong",raw:m,text:p,tokens:this.lexer.inlineTokens(p)}}}}codespan(a){let e=this.rules.inline.code.exec(a);if(e){let i=e[2].replace(this.rules.other.newLineCharGlobal," "),t=this.rules.other.nonSpaceChar.test(i),s=this.rules.other.startingSpaceChar.test(i)&&this.rules.other.endingSpaceChar.test(i);return t&&s&&(i=i.substring(1,i.length-1)),{type:"codespan",raw:e[0],text:i}}}br(a){let e=this.rules.inline.br.exec(a);if(e)return{type:"br",raw:e[0]}}del(a){let e=this.rules.inline.del.exec(a);if(e)return{type:"del",raw:e[0],text:e[2],tokens:this.lexer.inlineTokens(e[2])}}autolink(a){let e=this.rules.inline.autolink.exec(a);if(e){let i,t;return e[2]==="@"?(i=e[1],t="mailto:"+i):(i=e[1],t=i),{type:"link",raw:e[0],text:i,href:t,tokens:[{type:"text",raw:i,text:i}]}}}url(a){var i;let e;if(e=this.rules.inline.url.exec(a)){let t,s;if(e[2]==="@")t=e[0],s="mailto:"+t;else{let r;do r=e[0],e[0]=((i=this.rules.inline._backpedal.exec(e[0]))==null?void 0:i[0])??"";while(r!==e[0]);t=e[0],e[1]==="www."?s="http://"+e[0]:s=e[0]}return{type:"link",raw:e[0],text:t,href:s,tokens:[{type:"text",raw:t,text:t}]}}}inlineText(a){let e=this.rules.inline.text.exec(a);if(e){let i=this.lexer.state.inRawBlock;return{type:"text",raw:e[0],text:e[0],escaped:i}}}},C=class O{constructor(e){f(this,"tokens");f(this,"options");f(this,"state");f(this,"tokenizer");f(this,"inlineQueue");this.tokens=[],this.tokens.links=Object.create(null),this.options=e||R,this.options.tokenizer=this.options.tokenizer||new M,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let i={other:x,block:T.normal,inline:S.normal};this.options.pedantic?(i.block=T.pedantic,i.inline=S.pedantic):this.options.gfm&&(i.block=T.gfm,this.options.breaks?i.inline=S.breaks:i.inline=S.gfm),this.tokenizer.rules=i}static get rules(){return{block:T,inline:S}}static lex(e,i){return new O(i).lex(e)}static lexInline(e,i){return new O(i).inlineTokens(e)}lex(e){e=e.replace(x.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let i=0;i<this.inlineQueue.length;i++){let t=this.inlineQueue[i];this.inlineTokens(t.src,t.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(e,i=[],t=!1){var s,r,d;for(this.options.pedantic&&(e=e.replace(x.tabCharGlobal,"    ").replace(x.spaceLine,""));e;){let n;if((r=(s=this.options.extensions)==null?void 0:s.block)!=null&&r.some(o=>(n=o.call({lexer:this},e,i))?(e=e.substring(n.raw.length),i.push(n),!0):!1))continue;if(n=this.tokenizer.space(e)){e=e.substring(n.raw.length);let o=i.at(-1);n.raw.length===1&&o!==void 0?o.raw+=`
`:i.push(n);continue}if(n=this.tokenizer.code(e)){e=e.substring(n.raw.length);let o=i.at(-1);(o==null?void 0:o.type)==="paragraph"||(o==null?void 0:o.type)==="text"?(o.raw+=`
`+n.raw,o.text+=`
`+n.text,this.inlineQueue.at(-1).src=o.text):i.push(n);continue}if(n=this.tokenizer.fences(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.heading(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.hr(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.blockquote(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.list(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.html(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.def(e)){e=e.substring(n.raw.length);let o=i.at(-1);(o==null?void 0:o.type)==="paragraph"||(o==null?void 0:o.type)==="text"?(o.raw+=`
`+n.raw,o.text+=`
`+n.raw,this.inlineQueue.at(-1).src=o.text):this.tokens.links[n.tag]||(this.tokens.links[n.tag]={href:n.href,title:n.title});continue}if(n=this.tokenizer.table(e)){e=e.substring(n.raw.length),i.push(n);continue}if(n=this.tokenizer.lheading(e)){e=e.substring(n.raw.length),i.push(n);continue}let l=e;if((d=this.options.extensions)!=null&&d.startBlock){let o=1/0,c=e.slice(1),m;this.options.extensions.startBlock.forEach(p=>{m=p.call({lexer:this},c),typeof m=="number"&&m>=0&&(o=Math.min(o,m))}),o<1/0&&o>=0&&(l=e.substring(0,o+1))}if(this.state.top&&(n=this.tokenizer.paragraph(l))){let o=i.at(-1);t&&(o==null?void 0:o.type)==="paragraph"?(o.raw+=`
`+n.raw,o.text+=`
`+n.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):i.push(n),t=l.length!==e.length,e=e.substring(n.raw.length);continue}if(n=this.tokenizer.text(e)){e=e.substring(n.raw.length);let o=i.at(-1);(o==null?void 0:o.type)==="text"?(o.raw+=`
`+n.raw,o.text+=`
`+n.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):i.push(n);continue}if(e){let o="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(o);break}else throw new Error(o)}}return this.state.top=!0,i}inline(e,i=[]){return this.inlineQueue.push({src:e,tokens:i}),i}inlineTokens(e,i=[]){var n,l,o;let t=e,s=null;if(this.tokens.links){let c=Object.keys(this.tokens.links);if(c.length>0)for(;(s=this.tokenizer.rules.inline.reflinkSearch.exec(t))!=null;)c.includes(s[0].slice(s[0].lastIndexOf("[")+1,-1))&&(t=t.slice(0,s.index)+"["+"a".repeat(s[0].length-2)+"]"+t.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(s=this.tokenizer.rules.inline.anyPunctuation.exec(t))!=null;)t=t.slice(0,s.index)+"++"+t.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);for(;(s=this.tokenizer.rules.inline.blockSkip.exec(t))!=null;)t=t.slice(0,s.index)+"["+"a".repeat(s[0].length-2)+"]"+t.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);let r=!1,d="";for(;e;){r||(d=""),r=!1;let c;if((l=(n=this.options.extensions)==null?void 0:n.inline)!=null&&l.some(p=>(c=p.call({lexer:this},e,i))?(e=e.substring(c.raw.length),i.push(c),!0):!1))continue;if(c=this.tokenizer.escape(e)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.tag(e)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.link(e)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(c.raw.length);let p=i.at(-1);c.type==="text"&&(p==null?void 0:p.type)==="text"?(p.raw+=c.raw,p.text+=c.text):i.push(c);continue}if(c=this.tokenizer.emStrong(e,t,d)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.codespan(e)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.br(e)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.del(e)){e=e.substring(c.raw.length),i.push(c);continue}if(c=this.tokenizer.autolink(e)){e=e.substring(c.raw.length),i.push(c);continue}if(!this.state.inLink&&(c=this.tokenizer.url(e))){e=e.substring(c.raw.length),i.push(c);continue}let m=e;if((o=this.options.extensions)!=null&&o.startInline){let p=1/0,b=e.slice(1),v;this.options.extensions.startInline.forEach(k=>{v=k.call({lexer:this},b),typeof v=="number"&&v>=0&&(p=Math.min(p,v))}),p<1/0&&p>=0&&(m=e.substring(0,p+1))}if(c=this.tokenizer.inlineText(m)){e=e.substring(c.raw.length),c.raw.slice(-1)!=="_"&&(d=c.raw.slice(-1)),r=!0;let p=i.at(-1);(p==null?void 0:p.type)==="text"?(p.raw+=c.raw,p.text+=c.text):i.push(c);continue}if(e){let p="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(p);break}else throw new Error(p)}}return i}},$=class{constructor(a){f(this,"options");f(this,"parser");this.options=a||R}space(a){return""}code({text:a,lang:e,escaped:i}){var r;let t=(r=(e||"").match(x.notSpaceStart))==null?void 0:r[0],s=a.replace(x.endingNewline,"")+`
`;return t?'<pre><code class="language-'+y(t)+'">'+(i?s:y(s,!0))+`</code></pre>
`:"<pre><code>"+(i?s:y(s,!0))+`</code></pre>
`}blockquote({tokens:a}){return`<blockquote>
${this.parser.parse(a)}</blockquote>
`}html({text:a}){return a}heading({tokens:a,depth:e}){return`<h${e}>${this.parser.parseInline(a)}</h${e}>
`}hr(a){return`<hr>
`}list(a){let e=a.ordered,i=a.start,t="";for(let d=0;d<a.items.length;d++){let n=a.items[d];t+=this.listitem(n)}let s=e?"ol":"ul",r=e&&i!==1?' start="'+i+'"':"";return"<"+s+r+`>
`+t+"</"+s+`>
`}listitem(a){var i;let e="";if(a.task){let t=this.checkbox({checked:!!a.checked});a.loose?((i=a.tokens[0])==null?void 0:i.type)==="paragraph"?(a.tokens[0].text=t+" "+a.tokens[0].text,a.tokens[0].tokens&&a.tokens[0].tokens.length>0&&a.tokens[0].tokens[0].type==="text"&&(a.tokens[0].tokens[0].text=t+" "+y(a.tokens[0].tokens[0].text),a.tokens[0].tokens[0].escaped=!0)):a.tokens.unshift({type:"text",raw:t+" ",text:t+" ",escaped:!0}):e+=t+" "}return e+=this.parser.parse(a.tokens,!!a.loose),`<li>${e}</li>
`}checkbox({checked:a}){return"<input "+(a?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:a}){return`<p>${this.parser.parseInline(a)}</p>
`}table(a){let e="",i="";for(let s=0;s<a.header.length;s++)i+=this.tablecell(a.header[s]);e+=this.tablerow({text:i});let t="";for(let s=0;s<a.rows.length;s++){let r=a.rows[s];i="";for(let d=0;d<r.length;d++)i+=this.tablecell(r[d]);t+=this.tablerow({text:i})}return t&&(t=`<tbody>${t}</tbody>`),`<table>
<thead>
`+e+`</thead>
`+t+`</table>
`}tablerow({text:a}){return`<tr>
${a}</tr>
`}tablecell(a){let e=this.parser.parseInline(a.tokens),i=a.header?"th":"td";return(a.align?`<${i} align="${a.align}">`:`<${i}>`)+e+`</${i}>
`}strong({tokens:a}){return`<strong>${this.parser.parseInline(a)}</strong>`}em({tokens:a}){return`<em>${this.parser.parseInline(a)}</em>`}codespan({text:a}){return`<code>${y(a,!0)}</code>`}br(a){return"<br>"}del({tokens:a}){return`<del>${this.parser.parseInline(a)}</del>`}link({href:a,title:e,tokens:i}){let t=this.parser.parseInline(i),s=me(a);if(s===null)return t;a=s;let r='<a href="'+a+'"';return e&&(r+=' title="'+y(e)+'"'),r+=">"+t+"</a>",r}image({href:a,title:e,text:i,tokens:t}){t&&(i=this.parser.parseInline(t,this.parser.textRenderer));let s=me(a);if(s===null)return y(i);a=s;let r=`<img src="${a}" alt="${i}"`;return e&&(r+=` title="${y(e)}"`),r+=">",r}text(a){return"tokens"in a&&a.tokens?this.parser.parseInline(a.tokens):"escaped"in a&&a.escaped?a.text:y(a.text)}},ae=class{strong({text:a}){return a}em({text:a}){return a}codespan({text:a}){return a}del({text:a}){return a}html({text:a}){return a}text({text:a}){return a}link({text:a}){return""+a}image({text:a}){return""+a}br(){return""}},P=class U{constructor(e){f(this,"options");f(this,"renderer");f(this,"textRenderer");this.options=e||R,this.options.renderer=this.options.renderer||new $,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new ae}static parse(e,i){return new U(i).parse(e)}static parseInline(e,i){return new U(i).parseInline(e)}parse(e,i=!0){var s,r;let t="";for(let d=0;d<e.length;d++){let n=e[d];if((r=(s=this.options.extensions)==null?void 0:s.renderers)!=null&&r[n.type]){let o=n,c=this.options.extensions.renderers[o.type].call({parser:this},o);if(c!==!1||!["space","hr","heading","code","table","blockquote","list","html","paragraph","text"].includes(o.type)){t+=c||"";continue}}let l=n;switch(l.type){case"space":{t+=this.renderer.space(l);continue}case"hr":{t+=this.renderer.hr(l);continue}case"heading":{t+=this.renderer.heading(l);continue}case"code":{t+=this.renderer.code(l);continue}case"table":{t+=this.renderer.table(l);continue}case"blockquote":{t+=this.renderer.blockquote(l);continue}case"list":{t+=this.renderer.list(l);continue}case"html":{t+=this.renderer.html(l);continue}case"paragraph":{t+=this.renderer.paragraph(l);continue}case"text":{let o=l,c=this.renderer.text(o);for(;d+1<e.length&&e[d+1].type==="text";)o=e[++d],c+=`
`+this.renderer.text(o);i?t+=this.renderer.paragraph({type:"paragraph",raw:c,text:c,tokens:[{type:"text",raw:c,text:c,escaped:!0}]}):t+=c;continue}default:{let o='Token with "'+l.type+'" type was not found.';if(this.options.silent)return console.error(o),"";throw new Error(o)}}}return t}parseInline(e,i=this.renderer){var s,r;let t="";for(let d=0;d<e.length;d++){let n=e[d];if((r=(s=this.options.extensions)==null?void 0:s.renderers)!=null&&r[n.type]){let o=this.options.extensions.renderers[n.type].call({parser:this},n);if(o!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(n.type)){t+=o||"";continue}}let l=n;switch(l.type){case"escape":{t+=i.text(l);break}case"html":{t+=i.html(l);break}case"link":{t+=i.link(l);break}case"image":{t+=i.image(l);break}case"strong":{t+=i.strong(l);break}case"em":{t+=i.em(l);break}case"codespan":{t+=i.codespan(l);break}case"br":{t+=i.br(l);break}case"del":{t+=i.del(l);break}case"text":{t+=i.text(l);break}default:{let o='Token with "'+l.type+'" type was not found.';if(this.options.silent)return console.error(o),"";throw new Error(o)}}}return t}},_,j=(_=class{constructor(a){f(this,"options");f(this,"block");this.options=a||R}preprocess(a){return a}postprocess(a){return a}processAllTokens(a){return a}provideLexer(){return this.block?C.lex:C.lexInline}provideParser(){return this.block?P.parse:P.parseInline}},f(_,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens"])),_),Ca=class{constructor(...a){f(this,"defaults",Q());f(this,"options",this.setOptions);f(this,"parse",this.parseMarkdown(!0));f(this,"parseInline",this.parseMarkdown(!1));f(this,"Parser",P);f(this,"Renderer",$);f(this,"TextRenderer",ae);f(this,"Lexer",C);f(this,"Tokenizer",M);f(this,"Hooks",j);this.use(...a)}walkTokens(a,e){var t,s;let i=[];for(let r of a)switch(i=i.concat(e.call(this,r)),r.type){case"table":{let d=r;for(let n of d.header)i=i.concat(this.walkTokens(n.tokens,e));for(let n of d.rows)for(let l of n)i=i.concat(this.walkTokens(l.tokens,e));break}case"list":{let d=r;i=i.concat(this.walkTokens(d.items,e));break}default:{let d=r;(s=(t=this.defaults.extensions)==null?void 0:t.childTokens)!=null&&s[d.type]?this.defaults.extensions.childTokens[d.type].forEach(n=>{let l=d[n].flat(1/0);i=i.concat(this.walkTokens(l,e))}):d.tokens&&(i=i.concat(this.walkTokens(d.tokens,e)))}}return i}use(...a){let e=this.defaults.extensions||{renderers:{},childTokens:{}};return a.forEach(i=>{let t={...i};if(t.async=this.defaults.async||t.async||!1,i.extensions&&(i.extensions.forEach(s=>{if(!s.name)throw new Error("extension name required");if("renderer"in s){let r=e.renderers[s.name];r?e.renderers[s.name]=function(...d){let n=s.renderer.apply(this,d);return n===!1&&(n=r.apply(this,d)),n}:e.renderers[s.name]=s.renderer}if("tokenizer"in s){if(!s.level||s.level!=="block"&&s.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let r=e[s.level];r?r.unshift(s.tokenizer):e[s.level]=[s.tokenizer],s.start&&(s.level==="block"?e.startBlock?e.startBlock.push(s.start):e.startBlock=[s.start]:s.level==="inline"&&(e.startInline?e.startInline.push(s.start):e.startInline=[s.start]))}"childTokens"in s&&s.childTokens&&(e.childTokens[s.name]=s.childTokens)}),t.extensions=e),i.renderer){let s=this.defaults.renderer||new $(this.defaults);for(let r in i.renderer){if(!(r in s))throw new Error(`renderer '${r}' does not exist`);if(["options","parser"].includes(r))continue;let d=r,n=i.renderer[d],l=s[d];s[d]=(...o)=>{let c=n.apply(s,o);return c===!1&&(c=l.apply(s,o)),c||""}}t.renderer=s}if(i.tokenizer){let s=this.defaults.tokenizer||new M(this.defaults);for(let r in i.tokenizer){if(!(r in s))throw new Error(`tokenizer '${r}' does not exist`);if(["options","rules","lexer"].includes(r))continue;let d=r,n=i.tokenizer[d],l=s[d];s[d]=(...o)=>{let c=n.apply(s,o);return c===!1&&(c=l.apply(s,o)),c}}t.tokenizer=s}if(i.hooks){let s=this.defaults.hooks||new j;for(let r in i.hooks){if(!(r in s))throw new Error(`hook '${r}' does not exist`);if(["options","block"].includes(r))continue;let d=r,n=i.hooks[d],l=s[d];j.passThroughHooks.has(r)?s[d]=o=>{if(this.defaults.async)return Promise.resolve(n.call(s,o)).then(m=>l.call(s,m));let c=n.call(s,o);return l.call(s,c)}:s[d]=(...o)=>{let c=n.apply(s,o);return c===!1&&(c=l.apply(s,o)),c}}t.hooks=s}if(i.walkTokens){let s=this.defaults.walkTokens,r=i.walkTokens;t.walkTokens=function(d){let n=[];return n.push(r.call(this,d)),s&&(n=n.concat(s.call(this,d))),n}}this.defaults={...this.defaults,...t}}),this}setOptions(a){return this.defaults={...this.defaults,...a},this}lexer(a,e){return C.lex(a,e??this.defaults)}parser(a,e){return P.parse(a,e??this.defaults)}parseMarkdown(a){return(e,i)=>{let t={...i},s={...this.defaults,...t},r=this.onError(!!s.silent,!!s.async);if(this.defaults.async===!0&&t.async===!1)return r(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof e>"u"||e===null)return r(new Error("marked(): input parameter is undefined or null"));if(typeof e!="string")return r(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(e)+", string expected"));s.hooks&&(s.hooks.options=s,s.hooks.block=a);let d=s.hooks?s.hooks.provideLexer():a?C.lex:C.lexInline,n=s.hooks?s.hooks.provideParser():a?P.parse:P.parseInline;if(s.async)return Promise.resolve(s.hooks?s.hooks.preprocess(e):e).then(l=>d(l,s)).then(l=>s.hooks?s.hooks.processAllTokens(l):l).then(l=>s.walkTokens?Promise.all(this.walkTokens(l,s.walkTokens)).then(()=>l):l).then(l=>n(l,s)).then(l=>s.hooks?s.hooks.postprocess(l):l).catch(r);try{s.hooks&&(e=s.hooks.preprocess(e));let l=d(e,s);s.hooks&&(l=s.hooks.processAllTokens(l)),s.walkTokens&&this.walkTokens(l,s.walkTokens);let o=n(l,s);return s.hooks&&(o=s.hooks.postprocess(o)),o}catch(l){return r(l)}}}onError(a,e){return i=>{if(i.message+=`
Please report this to https://github.com/markedjs/marked.`,a){let t="<p>An error occurred:</p><pre>"+y(i.message+"",!0)+"</pre>";return e?Promise.resolve(t):t}if(e)return Promise.reject(i);throw i}}},A=new Ca;function g(a,e){return A.parse(a,e)}g.options=g.setOptions=function(a){return A.setOptions(a),g.defaults=A.defaults,fe(g.defaults),g};g.getDefaults=Q;g.defaults=R;g.use=function(...a){return A.use(...a),g.defaults=A.defaults,fe(g.defaults),g};g.walkTokens=function(a,e){return A.walkTokens(a,e)};g.parseInline=A.parseInline;g.Parser=P;g.parser=P.parse;g.Renderer=$;g.TextRenderer=ae;g.Lexer=C;g.lexer=C.lex;g.Tokenizer=M;g.Hooks=j;g.parse=g;g.options;g.setOptions;g.use;g.walkTokens;g.parseInline;P.parse;C.lex;const Pa=a=>{try{const e=g(a,{breaks:!0,gfm:!0});return Ge.sanitize(e)}catch(e){return console.error("Error rendering markdown:",e),a}},Aa={"visitantes-manual":{title:"Manual Completo - Módulo de Visitantes",icon:u.jsx($e,{className:"h-5 w-5"}),sections:[{id:"intro",title:"Introducción al Módulo",level:1,content:`
El **Módulo de Visitantes** es una herramienta integral diseñada para la gestión completa de la experiencia ciudadana en los parques urbanos de Guadalajara. Este módulo permite el monitoreo, análisis y mejora continua de la satisfacción de los visitantes mediante cinco componentes principales:

### ¿Para qué sirve?
- **Monitorear** el flujo de visitantes en tiempo real
- **Medir** la satisfacción ciudadana de manera sistemática
- **Analizar** tendencias de uso y preferencias
- **Mejorar** la calidad del servicio basado en datos reales
- **Reportar** métricas ejecutivas para toma de decisiones

### Acceso al Módulo
1. Inicie sesión en ParkSys con sus credenciales administrativas
2. En el sidebar administrativo, localice la sección **"Visitantes"**
3. Expanda el menú para acceder a las cinco funcionalidades
        `},{id:"dashboard",title:"Dashboard de Visitantes",level:1,content:`
### Descripción
El Dashboard proporciona una vista ejecutiva consolidada de todas las métricas relacionadas con visitantes, evaluaciones y retroalimentación ciudadana.

### Características Principales
- **Métricas Unificadas**: Total de visitantes, evaluaciones recibidas y promedio de calificaciones
- **Análisis Temporal**: Tendencias de visitación por períodos configurables
- **Vista por Parques**: Filtrado específico por ubicación
- **Gráficas Interactivas**: Visualización de datos mediante charts dinámicos

### Cómo Usar el Dashboard

#### Paso 1: Acceso
- Navegue a **Visitantes > Dashboard** en el sidebar administrativo
- El sistema cargará automáticamente los datos más recientes

#### Paso 2: Interpretación de Métricas
Las tarjetas superiores muestran:
- **Total Visitantes**: Suma histórica de todos los registros
- **Evaluaciones**: Cantidad total de evaluaciones recibidas
- **Promedio General**: Calificación promedio del sistema (escala 1-5 estrellas)
- **Retroalimentación**: Cantidad de comentarios y sugerencias

#### Paso 3: Filtrado de Información
- Use el **selector de parques** para filtrar datos específicos
- Seleccione **"Todos los parques"** para vista general
- Los datos se actualizarán automáticamente según su selección
        `},{id:"conteo",title:"Conteo de Visitantes",level:1,content:`
### Descripción
Sistema integral para el registro, seguimiento y análisis de la afluencia de visitantes en todos los parques del sistema.

### Funcionalidades Disponibles

#### Registro Manual de Visitantes
Permite capturar datos de visitación cuando no se cuenta con sistemas automáticos.

**Campos de Registro:**
- **Fecha**: Selección de fecha específica de registro
- **Parque**: Ubicación donde se realiza el conteo
- **Cantidad**: Número total de visitantes registrados
- **Método de Conteo**: Manual, Automático, o Estimado
- **Condiciones Climáticas**: Soleado, Nublado, Lluvioso, Otro
- **Observaciones**: Notas adicionales relevantes

#### Paso a Paso: Registrar Conteo Manual

1. **Acceso al Formulario**
   - Vaya a **Visitantes > Conteo**
   - Haga clic en **"Nuevo Registro"**

2. **Completar Información Básica**
   - Seleccione la **fecha** del conteo
   - Elija el **parque** correspondiente
   - Ingrese la **cantidad** de visitantes

3. **Especificar Método y Condiciones**
   - Seleccione **"Manual"** en método de conteo
   - Indique las **condiciones climáticas** observadas
   - Agregue **observaciones** si son relevantes

4. **Guardar Registro**
   - Revise la información ingresada
   - Haga clic en **"Guardar"**
   - El sistema confirmará el registro exitoso
        `},{id:"evaluaciones",title:"Evaluaciones de Visitantes",level:1,content:`
### Descripción
Sistema completo para capturar, gestionar y analizar la satisfacción de los visitantes mediante evaluaciones estructuradas.

### Componentes del Sistema

#### Formularios de Evaluación
Los ciudadanos pueden completar evaluaciones que incluyen:
- **Calificación General**: Escala de 1 a 5 estrellas
- **Criterios Específicos**: Limpieza, seguridad, amenidades, etc.
- **Comentarios Escritos**: Retroalimentación cualitativa
- **Datos del Evaluador**: Información demográfica opcional

#### Gestión Administrativa

**Vista de Lista:**
- Tabla completa de todas las evaluaciones recibidas
- Filtros por parque, calificación, fecha
- Paginación para manejo eficiente de volumen
- Exportación a CSV/Excel

**Vista de Fichas:**
- Formato visual tipo tarjetas
- Información resumida por evaluación
- Acceso rápido a detalles completos
- Ideal para revisión ejecutiva
        `},{id:"criterios",title:"Criterios de Evaluación",level:1,content:`
### Descripción
Módulo de configuración que permite definir y personalizar los parámetros de evaluación que utilizarán los visitantes.

### Gestión de Criterios

#### Criterios Predefinidos
El sistema incluye criterios base como:
- **Limpieza General**: Estado de limpieza del parque
- **Seguridad**: Percepción de seguridad personal
- **Amenidades**: Calidad de instalaciones (baños, bancas, etc.)
- **Mantenimiento**: Estado de conservación general
- **Accesibilidad**: Facilidad de acceso para personas con discapacidad

#### Mejores Prácticas
- **Límite de Criterios**: Mantenga entre 5-8 criterios para evitar fatiga del evaluador
- **Claridad**: Use nombres y descripciones fáciles de entender
- **Consistencia**: Mantenga escalas uniformes entre criterios similares
- **Relevancia**: Enfoque en aspectos que realmente puede mejorar
        `},{id:"retroalimentacion",title:"Retroalimentación Ciudadana",level:1,content:`
### Descripción
Canal directo de comunicación entre ciudadanos y administración para reportes, sugerencias y comentarios no estructurados.

### Tipos de Retroalimentación

#### Formularios Disponibles
1. **Compartir Experiencia**: Relatos positivos o negativos detallados
2. **Reportar Problema**: Incidencias específicas que requieren atención
3. **Sugerir Mejora**: Propuestas constructivas de los ciudadanos
4. **Proponer Evento**: Ideas para actividades en los parques

#### Estados de Seguimiento
- **Pendiente**: Retroalimentación recién recibida
- **En Progreso**: Se está trabajando en la respuesta/solución
- **Resuelto**: Acción completada o respuesta enviada
- **Archivado**: Comentarios para referencia histórica

### Sistema de Notificaciones Automáticas
- **Email Automático**: Se envía notificación a administradores al recibir nueva retroalimentación
- **Dashboard Alerts**: Indicadores visuales de items pendientes
- **Reportes Semanales**: Resumen automático de actividad
        `},{id:"faq",title:"Preguntas Frecuentes",level:1,content:`
### Generales

**P: ¿Con qué frecuencia se actualizan los datos en el Dashboard?**
R: Los datos se actualizan en tiempo real. Al ingresar nuevos registros, las métricas se reflejan inmediatamente en todas las vistas.

**P: ¿Puedo recuperar datos si elimino accidentalmente un registro?**
R: El sistema mantiene respaldos automáticos. Contacte al administrador técnico para recuperación de datos eliminados accidentalmente.

### Conteo de Visitantes

**P: ¿Qué hago si me equivoco al ingresar un conteo?**
R: Localice el registro en la lista, haga clic en "Editar" y corrija la información. El sistema mantendrá un historial de cambios.

**P: ¿Qué método de conteo debo seleccionar?**
R: Use "Manual" para conteos realizados por personal, "Automático" para datos de sensores, y "Estimado" para aproximaciones basadas en observación.

### Evaluaciones

**P: ¿Puedo modificar una evaluación después de que un ciudadano la envió?**
R: No es recomendable modificar evaluaciones de ciudadanos. Si hay errores evidentes, documente la situación y mantenga la evaluación original para transparencia.

### Técnicas

**P: ¿Qué navegadores son compatibles?**
R: El sistema funciona en Chrome, Firefox, Safari y Edge en sus versiones más recientes.

**P: ¿Puedo acceder desde dispositivos móviles?**
R: Sí, la interfaz es completamente responsive y funciona en tablets y smartphones.
        `}]},"parques-manual":{title:"Manual Completo - Gestión de Parques",icon:u.jsx(Ne,{className:"h-5 w-5"}),sections:[{id:"introduccion",title:"Introducción al Módulo",level:1,content:`
El **Módulo de Parques** es el corazón del sistema ParkSys, diseñado para la gestión integral de espacios verdes urbanos en la Ciudad de Guadalajara. Este módulo centraliza toda la información relacionada con la administración, mantenimiento y optimización de los parques municipales.

### Propósito Principal
- **Centralizar** la información de todos los parques del sistema
- **Monitorear** el estado operativo y de mantenimiento
- **Gestionar** amenidades y servicios disponibles
- **Analizar** datos de evaluaciones ciudadanas
- **Facilitar** la toma de decisiones basada en datos

### Acceso al Módulo
1. Inicie sesión en ParkSys con credenciales administrativas
2. En el sidebar administrativo, localice la sección **"Gestión"**
3. Expanda el menú y seleccione **"Parques"**
4. Acceda a los siguientes submenús:
   - Dashboard de Parques
   - Gestión de Parques
   - Evaluaciones de Parques
   - Dashboard de Amenidades
        `},{id:"dashboard",title:"Dashboard de Parques",level:1,content:`
### Descripción General
El Dashboard proporciona una vista ejecutiva consolidada de todos los indicadores clave de rendimiento (KPIs) relacionados con la gestión de parques urbanos.

### Características Principales

#### Métricas Fundamentales
- **Total de Parques**: Cantidad total de espacios verdes registrados
- **Parques Activos**: Espacios operativos y disponibles al público
- **Amenidades Totales**: Servicios e instalaciones disponibles
- **Evaluaciones Recibidas**: Retroalimentación ciudadana recopilada

#### Visualizaciones Interactivas
- **Gráficas de Estado**: Distribución de parques por condición operativa
- **Análisis de Amenidades**: Tipos de servicios más comunes
- **Tendencias de Evaluación**: Evolución de la satisfacción ciudadana
- **Distribución Geográfica**: Mapeo de parques por zona

### Guía de Uso Paso a Paso

#### Paso 1: Acceso al Dashboard
1. Navegue a **Gestión > Parques > Dashboard**
2. El sistema cargará automáticamente los datos más recientes
3. Verifique que las métricas se muestren correctamente

#### Paso 2: Interpretación de Métricas
- **Tarjetas Superiores**: Muestran totales absolutos y porcentajes
- **Gráficas Principales**: Representan distribuciones y tendencias
- **Indicadores de Estado**: Código de colores para alertas

#### Paso 3: Análisis de Datos
- Use los filtros disponibles para segmentar información
- Compare períodos para identificar tendencias
- Identifique parques que requieren atención prioritaria

### Casos de Uso Recomendados

#### Revisión Diaria (5-10 minutos)
- Verificar estado general del sistema
- Identificar alertas o problemas críticos
- Revisar nuevas evaluaciones ciudadanas

#### Análisis Semanal (30-45 minutos)
- Comparar métricas con semana anterior
- Identificar tendencias emergentes
- Planificar intervenciones necesarias
        `},{id:"gestion",title:"Gestión de Parques",level:1,content:`
### Descripción General
La sección de Gestión permite la administración completa del inventario de parques, incluyendo creación, edición, visualización y eliminación de registros.

### Funcionalidades Principales

#### Vista de Lista de Parques
- **Listado Completo**: Todos los parques registrados en el sistema
- **Información Clave**: Nombre, ubicación, estado, amenidades principales
- **Búsqueda Avanzada**: Filtros por nombre, ubicación, estado y tipo
- **Acciones Rápidas**: Ver, editar, gestionar y eliminar parques

#### Creación de Nuevos Parques
**Información Básica Requerida:**
- Nombre oficial del parque
- Dirección completa y referencias
- Coordenadas geográficas (latitud/longitud)
- Área total en metros cuadrados
- Tipo de parque (urbano, metropolitano, vecinal, etc.)

**Información Adicional:**
- Descripción detallada del espacio
- Historia y contexto del parque
- Horarios de operación
- Contacto de administración local
- Fotografías representativas

#### Edición de Parques Existentes
1. **Acceso**: Click en "Editar" desde la lista de parques
2. **Modificación**: Actualizar cualquier campo disponible
3. **Validación**: El sistema verifica la integridad de los datos
4. **Confirmación**: Guardar cambios con registro de auditoría

### Gestión de Amenidades

#### Asignación de Amenidades
- **Selección Múltiple**: Asignar varias amenidades simultáneamente
- **Categorización**: Organizar por tipo de servicio
- **Estado**: Activar/desactivar amenidades específicas
- **Notas**: Agregar observaciones sobre condición o disponibilidad

#### Tipos de Amenidades Disponibles
**Recreación:**
- Juegos infantiles
- Canchas deportivas
- Áreas de ejercicio
- Espacios para mascotas

**Servicios:**
- Baños públicos
- Bebederos
- Estacionamiento
- Iluminación

**Infraestructura:**
- Bancas y mobiliario
- Senderos y caminos
- Áreas verdes
- Sistemas de riego
        `},{id:"evaluaciones",title:"Evaluaciones de Parques",level:1,content:`
### Descripción General
Sistema integral para la gestión y análisis de evaluaciones ciudadanas sobre la calidad y servicios de los parques urbanos.

### Características del Sistema

#### Recopilación de Evaluaciones
- **Formularios Web**: Disponibles en páginas públicas de cada parque
- **Aplicación Móvil**: Evaluación in-situ por parte de visitantes
- **Encuestas Programadas**: Campañas específicas de retroalimentación
- **Integración QR**: Códigos QR en parques para evaluación rápida

#### Métricas de Evaluación
**Criterios Principales:**
- Limpieza y mantenimiento (1-5 estrellas)
- Seguridad y iluminación (1-5 estrellas)
- Calidad de amenidades (1-5 estrellas)
- Accesibilidad universal (1-5 estrellas)
- Experiencia general (1-5 estrellas)

**Información del Evaluador:**
- Nombre completo (opcional)
- Correo electrónico para seguimiento
- Edad y género (estadísticas demográficas)
- Frecuencia de visita al parque
- Motivo principal de la visita

### Análisis y Reportes

#### Dashboard de Evaluaciones
- **Resumen Ejecutivo**: Promedio general y total de evaluaciones
- **Distribución por Criterio**: Gráficas de calificaciones específicas
- **Tendencias Temporales**: Evolución de satisfacción por período
- **Ranking de Parques**: Clasificación por calificación promedio

#### Filtros y Segmentación
- **Por Parque**: Evaluaciones específicas de un espacio
- **Por Período**: Rangos de fechas personalizables
- **Por Calificación**: Filtrar por nivel de satisfacción
- **Por Evaluador**: Análisis demográfico de usuarios

#### Gestión de Retroalimentación
1. **Visualización**: Lista completa de evaluaciones recibidas
2. **Detalle Individual**: Información completa de cada evaluación
3. **Seguimiento**: Estado de atención a comentarios y sugerencias
4. **Respuesta**: Sistema de comunicación con evaluadores
        `},{id:"amenidades",title:"Dashboard de Amenidades",level:1,content:`
### Descripción General
Panel especializado para la gestión integral del inventario de amenidades y servicios disponibles en todos los parques del sistema.

### Funcionalidades Principales

#### Inventario de Amenidades
- **Catálogo Completo**: Todas las amenidades registradas en el sistema
- **Clasificación por Tipo**: Categorización según función y propósito
- **Estado Operativo**: Disponible, en mantenimiento, fuera de servicio
- **Distribución por Parques**: Qué amenidades tiene cada espacio

#### Análisis de Distribución
**Gráficas de Distribución:**
- Amenidades más comunes en el sistema
- Parques con mayor cantidad de servicios
- Tipos de amenidades por zona geográfica
- Evolución del inventario por período

**Indicadores de Cobertura:**
- Porcentaje de parques con amenidades básicas
- Identificación de gaps en servicios
- Recomendaciones de equipamiento
- Análisis de necesidades no cubiertas

#### Gestión de Categorías
1. **Creación de Categorías**: Nuevos tipos de amenidades
2. **Organización**: Jerarquía y subcategorías
3. **Descripción**: Especificaciones técnicas y funcionales
4. **Iconografía**: Símbolos y representación visual

### Administración de Amenidades

#### Registro de Nuevas Amenidades
**Información Requerida:**
- Nombre descriptivo de la amenidad
- Categoría y subcategoría
- Descripción detallada
- Especificaciones técnicas
- Estado inicial (activa/inactiva)

#### Asignación a Parques
1. **Selección de Parque**: Elegir espacio específico
2. **Selección de Amenidades**: Múltiple selección disponible
3. **Configuración**: Estado y observaciones específicas
4. **Validación**: Verificar compatibilidad y requisitos

#### Mantenimiento y Actualización
- **Cambio de Estado**: Activar/desactivar servicios
- **Actualización de Información**: Modificar descripciones y especificaciones
- **Registro de Incidencias**: Reportes de problemas o daños
- **Programación de Mantenimiento**: Calendarios preventivos
        `},{id:"mejores-practicas",title:"Mejores Prácticas",level:1,content:`
### Gestión de Datos

#### Calidad de la Información
1. **Completitud**: Asegurar que todos los campos obligatorios estén llenos
2. **Precisión**: Verificar coordenadas geográficas y direcciones
3. **Actualización**: Mantener información de amenidades al día
4. **Consistencia**: Usar nomenclatura estándar para categorías

#### Fotografías y Multimedia
1. **Calidad**: Imágenes de alta resolución y buena iluminación
2. **Representatividad**: Mostrar aspectos más importantes del parque
3. **Actualización**: Renovar fotos cuando cambien instalaciones
4. **Organización**: Mantener galería organizada y etiquetada

### Análisis de Evaluaciones

#### Frecuencia de Revisión
- **Evaluaciones Críticas** (1-2 estrellas): Revisión inmediata
- **Evaluaciones Generales**: Revisión diaria
- **Análisis de Tendencias**: Revisión semanal
- **Reportes Ejecutivos**: Revisión mensual

#### Respuesta a Ciudadanos
1. **Tiempo de Respuesta**: Máximo 48 horas para evaluaciones críticas
2. **Tono Profesional**: Respuestas corteses y constructivas
3. **Seguimiento**: Informar sobre acciones tomadas
4. **Cierre del Ciclo**: Confirmar resolución de problemas

### Optimización del Sistema

#### Rendimiento
1. **Carga de Imágenes**: Usar formatos optimizados (WebP preferible)
2. **Filtros Eficientes**: Combinar criterios para búsquedas rápidas
3. **Exportaciones**: Programar reportes grandes en horarios de baja demanda
4. **Cache**: Aprovechar almacenamiento temporal para consultas frecuentes

#### Seguridad
1. **Contraseñas Seguras**: Políticas robustas para cuentas administrativas
2. **Accesos Limitados**: Principio de menor privilegio
3. **Auditoría**: Registro completo de acciones administrativas
4. **Respaldos**: Exportaciones regulares de datos críticos
        `},{id:"faq",title:"Preguntas Frecuentes",level:1,content:`
### Preguntas Generales

**P: ¿Cómo accedo al módulo de Parques?**
R: Inicie sesión en ParkSys, vaya al sidebar administrativo, expanda "Gestión" y seleccione "Parques". Verá los submenús disponibles según sus permisos.

**P: ¿Puedo gestionar varios parques simultáneamente?**
R: Sí, el sistema permite selección múltiple para acciones masivas como asignación de amenidades o exportación de datos.

**P: ¿Con qué frecuencia se actualizan los datos del dashboard?**
R: Los datos se actualizan en tiempo real. Las métricas reflejan información hasta el último registro ingresado en el sistema.

### Gestión de Parques

**P: ¿Qué información es obligatoria para crear un nuevo parque?**
R: Nombre, dirección, coordenadas geográficas, área total y tipo de parque son campos obligatorios.

**P: ¿Puedo modificar las coordenadas de un parque existente?**
R: Sí, desde la opción "Editar" del parque específico. Asegúrese de verificar la precisión de las nuevas coordenadas.

**P: ¿Cómo subo múltiples fotos de un parque?**
R: En la página de gestión del parque, use la sección "Gestión de Imágenes" para subir hasta 10 fotos adicionales a la imagen principal.

### Evaluaciones

**P: ¿Cómo se calculan los promedios de evaluación?**
R: Se promedian todas las calificaciones válidas recibidas. Las evaluaciones sin calificación numérica no afectan el promedio.

**P: ¿Puedo eliminar evaluaciones inapropiadas?**
R: Solo usuarios con permisos de Super Administrador pueden eliminar evaluaciones. Se recomienda marcarlas como "revisadas" en lugar de eliminarlas.

### Amenidades

**P: ¿Cómo creo una nueva categoría de amenidad?**
R: En el Dashboard de Amenidades, use la opción "Gestionar Categorías" para crear nuevos tipos de servicios.

**P: ¿Puedo asignar la misma amenidad a múltiples parques?**
R: Sí, las amenidades pueden asignarse a tantos parques como sea necesario.

### Problemas Técnicos

**P: Las imágenes no cargan correctamente, ¿qué hago?**
R: Verifique que las imágenes sean JPG, PNG o WebP y no excedan 5MB. Limpie la caché del navegador.

**P: ¿Por qué no puedo editar ciertos parques?**
R: Verifique sus permisos de usuario. Es posible que solo tenga acceso de lectura o a parques específicos.
        `},{id:"soporte",title:"Soporte Técnico",level:1,content:`
### Canales de Comunicación

#### Soporte Inmediato
- **Chat en Vivo**: Disponible en horario de oficina (8:00 AM - 6:00 PM)
- **Teléfono**: +52 (33) 1234-5678 ext. 100
- **WhatsApp Business**: +52 (33) 9876-5432

#### Soporte por Email
- **Técnico**: soporte.parksys@guadalajara.gob.mx
- **Administrativo**: admin.parksys@guadalajara.gob.mx
- **Urgencias**: urgencias.parksys@guadalajara.gob.mx

### Procedimiento de Reporte de Problemas

#### Información Requerida
1. **Usuario**: Nombre y rol en el sistema
2. **Fecha/Hora**: Cuándo ocurrió el problema
3. **Acción**: Qué estaba intentando hacer
4. **Error**: Mensaje específico o comportamiento inesperado
5. **Navegador**: Tipo y versión del navegador utilizado
6. **Capturas**: Screenshots que muestren el problema

#### Categorías de Urgencia
**Crítica (Respuesta en 1 hora):**
- Sistema completamente inaccesible
- Pérdida de datos confirmada
- Problemas de seguridad

**Alta (Respuesta en 4 horas):**
- Funcionalidades principales no disponibles
- Errores que impiden operación normal
- Problemas de rendimiento severos

**Media (Respuesta en 24 horas):**
- Funcionalidades específicas con problemas
- Errores menores que permiten trabajo alternativo
- Solicitudes de mejoras importantes

### Acuerdos de Nivel de Servicio (SLA)

#### Disponibilidad del Sistema
- **Objetivo**: 99.5% de uptime mensual
- **Horario de Operación**: 24/7/365
- **Tiempo de Respuesta**: < 2 segundos para operaciones básicas
- **Tiempo de Carga**: < 5 segundos para reportes complejos

#### Soporte Técnico
- **Horario de Atención**: Lunes a viernes 8:00 AM - 6:00 PM
- **Emergencias**: 24/7 para problemas críticos
- **Resolución**: 90% de tickets resueltos en tiempo acordado
- **Satisfacción**: Meta de 95% de satisfacción en encuestas
        `}]},"actividades-manual":{title:"Manual Completo - Módulo de Actividades",icon:u.jsx(Le,{className:"h-5 w-5"}),sections:[{id:"intro",title:"Introducción al Módulo de Actividades",level:1,content:`
El **Módulo de Actividades** es una herramienta integral diseñada para la gestión completa de actividades recreativas, culturales, deportivas y educativas en los parques urbanos de Guadalajara. Este módulo permite la planificación, organización, seguimiento y análisis de todas las actividades que se realizan en el sistema de parques.

### ¿Para qué sirve?
- **Planificar** y organizar actividades en todos los parques
- **Gestionar** instructores, participantes y recursos
- **Monitorear** la participación ciudadana y satisfacción
- **Analizar** tendencias de participación y preferencias
- **Administrar** categorías, horarios y capacidades
- **Controlar** inscripciones y pagos (cuando aplique)

### Componentes del Módulo
El módulo está organizado en varias secciones principales:

1. **Gestión de Actividades**: Creación, edición y administración
2. **Categorías**: Organización por tipos de actividades
3. **Instructores**: Gestión del personal capacitado
4. **Inscripciones**: Control de participantes y cupos
5. **Horarios**: Programación y calendarios
6. **Reportes**: Análisis y métricas de participación

### Acceso al Módulo
1. Inicie sesión en ParkSys con sus credenciales administrativas
2. En el sidebar administrativo, localice la sección **"Actividades"**
3. Expanda el menú para acceder a las diferentes funcionalidades
4. Use los filtros y herramientas según sus permisos asignados
        `},{id:"listado",title:"Listado y Gestión de Actividades",level:1,content:`
### Descripción General
La sección de **Listado de Actividades** proporciona una vista completa de todas las actividades programadas, activas y finalizadas en el sistema. Es el hub central para administrar el catálogo completo de ofertas recreativas.

### Características Principales

#### Vista Unificada
- **Catálogo Completo**: Todas las actividades del sistema en una sola vista
- **Información Detallada**: Estado, instructor, parque, horarios y participación
- **Filtros Avanzados**: Por categoría, estado, instructor, parque y fechas
- **Búsqueda Inteligente**: Por nombre, descripción o palabras clave

#### Estados de Actividades
Las actividades pueden tener los siguientes estados:
- **🟢 Activa**: Disponible para inscripciones
- **🟡 Programada**: Definida pero aún no iniciada
- **🔴 Cancelada**: Suspendida temporalmente
- **⚫ Finalizada**: Completada y archivada
- **🟠 En Pausa**: Temporalmente suspendida

### Funcionalidades de Gestión

#### Creación de Nuevas Actividades
**Información Básica Requerida:**
- **Nombre**: Título descriptivo de la actividad
- **Descripción**: Detalles completos del contenido
- **Categoría**: Clasificación por tipo (deportiva, cultural, etc.)
- **Instructor**: Personal asignado responsable
- **Parque**: Ubicación donde se realizará
- **Capacidad**: Número máximo de participantes

**Configuración Avanzada:**
- **Horarios**: Días y horas específicas
- **Duración**: Tiempo por sesión
- **Nivel**: Principiante, intermedio, avanzado
- **Edad**: Rangos de edad permitidos
- **Costo**: Gratuita o con tarifa específica
- **Requisitos**: Materiales o condiciones necesarias

#### Gestión de Imágenes
- **Imagen Principal**: Foto representativa de la actividad
- **Galería**: Hasta 5 imágenes adicionales
- **Formatos Soportados**: JPG, PNG, WebP (máximo 5MB)
- **Optimización Automática**: Redimensionado para web

### Acciones Disponibles

#### Por Actividad Individual
1. **👁️ Ver Detalles**: Información completa y estadísticas
2. **✏️ Editar**: Modificar cualquier aspecto de la actividad
3. **📸 Gestionar Imágenes**: Subir, cambiar o eliminar fotos
4. **👥 Ver Inscripciones**: Lista de participantes actuales
5. **📊 Estadísticas**: Métricas de participación y satisfacción
6. **🗑️ Eliminar**: Cancelar permanentemente (solo administradores)

#### Acciones Masivas
- **Exportar**: Generar reportes en Excel/CSV
- **Cambiar Estado**: Modificar múltiples actividades
- **Asignar Instructor**: Reasignar responsables
- **Duplicar**: Crear copias para nuevos períodos
        `},{id:"categorias",title:"Gestión de Categorías",level:1,content:`
### Descripción del Sistema
Las **Categorías de Actividades** permiten organizar y clasificar toda la oferta recreativa de manera coherente y fácil de navegar tanto para administradores como para ciudadanos.

### Categorías Predeterminadas del Sistema

#### 🏃 Deportivo
- **Descripción**: Actividades deportivas y de acondicionamiento físico
- **Ejemplos**: Fútbol, básquetbol, atletismo, natación, gimnasia
- **Color**: Rojo (#e74c3c)
- **Características**: Actividad física intensa y competitiva

#### 💚 Recreación y Bienestar  
- **Descripción**: Actividades recreativas para el bienestar físico y mental
- **Ejemplos**: Yoga, tai chi, caminatas, meditación, relajación
- **Color**: Verde (#2ecc71)
- **Características**: Salud física y mental, relajación

#### 🎨 Arte y Cultura
- **Descripción**: Eventos culturales, artísticos y creativos
- **Ejemplos**: Pintura, danza, música, teatro, exposiciones
- **Color**: Púrpura (#9b59b6)
- **Características**: Desarrollo artístico y expresión creativa

#### 🌱 Naturaleza y Ciencia
- **Descripción**: Actividades de conservación, medio ambiente y educación científica
- **Ejemplos**: Jardinería, observación de aves, talleres ecológicos, experimentos
- **Color**: Verde Oscuro (#27ae60)
- **Características**: Conciencia ambiental y conocimiento científico

#### 👥 Comunidad
- **Descripción**: Eventos de participación y cohesión comunitaria
- **Ejemplos**: Reuniones vecinales, festivales comunitarios, actividades solidarias
- **Color**: Azul (#3498db)
- **Características**: Participación ciudadana y fortalecimiento social

#### 📅 Eventos de Temporada
- **Descripción**: Celebraciones y eventos especiales según temporadas
- **Ejemplos**: Día del niño, festivales navideños, celebraciones patrias
- **Color**: Naranja (#f39c12)
- **Características**: Celebraciones especiales y eventos únicos

### Administración de Categorías

#### Crear Nueva Categoría
**Proceso paso a paso:**
1. Acceda a **Actividades > Categorías**
2. Haga clic en **"Nueva Categoría"**
3. Complete la información requerida:
   - **Nombre**: Identificación clara
   - **Descripción**: Explicación del propósito
   - **Color**: Código hexadecimal para identificación visual
   - **Icono**: Símbolo representativo
   - **Estado**: Activa o inactiva

#### Modificar Categorías Existentes
- **Edición**: Cambiar nombre, descripción o color
- **Activar/Desactivar**: Controlar disponibilidad
- **Reorganizar**: Cambiar orden de aparición
- **Estadísticas**: Ver cantidad de actividades por categoría

### Impacto en el Sistema

#### Para Administradores
- **Organización**: Mejor estructura del catálogo
- **Reportes**: Análisis por tipo de actividad
- **Filtros**: Búsquedas más eficientes
- **Planificación**: Equilibrio en la oferta

#### Para Ciudadanos
- **Navegación**: Encontrar actividades de interés fácilmente
- **Identificación**: Reconocimiento visual rápido
- **Búsqueda**: Filtros intuitivos en el portal público
- **Experiencia**: Interface más organizada y clara
        `},{id:"instructores",title:"Gestión de Instructores",level:1,content:`
### Descripción del Sistema
La **Gestión de Instructores** es fundamental para asegurar la calidad y profesionalismo de todas las actividades. Este módulo maneja desde el registro hasta la evaluación continua del personal.

### Proceso de Registro

#### Invitación por Email
El sistema utiliza un proceso de invitación controlado:

1. **Generación de Invitación**: Administrador crea invitación con datos básicos
2. **Envío Automático**: Email con enlace único y token de seguridad
3. **Registro Completo**: Instructor completa su perfil detallado
4. **Validación**: Revisión administrativa antes de activación

#### Información del Perfil
**Datos Personales:**
- Nombre completo y datos de contacto
- Fotografía de perfil profesional
- Currículum vitae (PDF/DOC)
- Experiencia y certificaciones

**Información Profesional:**
- Especialidades y áreas de expertise
- Años de experiencia
- Tarifas por hora (si aplica)
- Disponibilidad de días y horarios
- Parque preferido de trabajo

### Estados del Instructor

#### 🟢 Activo
- Disponible para asignación a actividades
- Perfil visible en listados internos
- Puede recibir evaluaciones
- Acceso completo al sistema

#### 🟡 Pendiente
- Registro iniciado pero incompleto
- En proceso de validación administrativa
- Sin acceso a funcionalidades
- Requiere completar documentación

#### 🔴 Inactivo
- Temporalmente fuera del sistema
- No disponible para nuevas actividades
- Mantiene historial y evaluaciones
- Puede reactivarse cuando sea necesario

### Funcionalidades de Gestión

#### Perfil Detallado del Instructor
**Vista Completa Incluye:**
- **Información Personal**: Datos básicos y contacto
- **Experiencia**: Historial y especialidades
- **Actividades Actuales**: Programación activa
- **Evaluaciones Recibidas**: Calificaciones y comentarios
- **Currículum**: Descarga/visualización de CV
- **Estadísticas**: Métricas de desempeño

#### Asignación a Actividades
**Proceso de Asignación:**
1. Desde la creación/edición de actividad
2. Selección de instructor disponible
3. Verificación de compatibilidad (horarios, especialidad)
4. Confirmación automática o manual
5. Notificación al instructor

#### Sistema de Evaluaciones
**Evaluación Pública**: Los participantes pueden evaluar instructores
**Evaluación Administrativa**: Revisiones internas periódicas
**Criterios de Evaluación:**
- Conocimiento técnico
- Habilidades de comunicación
- Metodología de enseñanza
- Puntualidad y profesionalismo
- Desempeño general

### Métricas y Reportes

#### Indicadores por Instructor
- **Calificación Promedio**: Basada en evaluaciones recibidas
- **Actividades Impartidas**: Histórico completo
- **Participantes Atendidos**: Total de personas impactadas
- **Índice de Satisfacción**: Porcentaje de evaluaciones positivas

#### Reportes Disponibles
- **Listado Completo**: Todos los instructores con filtros
- **Evaluaciones Detalladas**: Análisis de desempeño
- **Actividad por Período**: Productividad temporal
- **Certificaciones**: Validez de documentos
        `},{id:"inscripciones",title:"Sistema de Inscripciones",level:1,content:`
### Descripción General
El **Sistema de Inscripciones** gestiona la participación ciudadana en actividades, controlando cupos, listas de espera, confirmaciones y seguimiento de asistencia.

### Tipos de Inscripción

#### 🆓 Inscripción Gratuita
- **Proceso Simple**: Solo datos básicos requeridos
- **Confirmación Inmediata**: Sin procesos de pago
- **Control de Cupo**: Límite por capacidad de actividad
- **Lista de Espera**: Automática cuando se llena

#### 💳 Inscripción con Pago
- **Datos Completos**: Información personal y de pago
- **Reserva Temporal**: 15 minutos para completar pago
- **Confirmación**: Solo después del pago exitoso
- **Facturación**: Comprobante automático

### Proceso de Inscripción

#### Para el Ciudadano
1. **Selección**: Elegir actividad de interés
2. **Verificación**: Confirmar horarios y requisitos
3. **Registro**: Completar formulario de inscripción
4. **Pago** (si aplica): Procesar tarifa correspondiente
5. **Confirmación**: Recibir comprobante por email

#### Estados de Inscripción
- **✅ Confirmada**: Lugar asegurado en la actividad
- **⏳ Pendiente**: En proceso de validación/pago
- **📋 En Lista de Espera**: Sin cupo disponible actualmente
- **❌ Cancelada**: Anulada por el participante
- **⚠️ No Presentado**: No asistió a las sesiones

### Gestión Administrativa

#### Panel de Control
**Vista por Actividad:**
- Lista completa de inscritos
- Estado de cada inscripción
- Datos de contacto de participantes
- Historial de asistencias
- Pagos realizados (si aplica)

**Acciones Disponibles:**
- **✏️ Editar Inscripción**: Modificar datos del participante
- **📧 Enviar Comunicación**: Email directo al inscrito
- **📊 Marcar Asistencia**: Control de presencia en sesiones
- **💰 Gestionar Pago**: Ver estado y procesar reembolsos
- **🗑️ Cancelar Inscripción**: Liberar cupo

#### Lista de Espera
**Funcionamiento Automático:**
- Se activa cuando se alcanza capacidad máxima
- Los nuevos interesados se agregan automáticamente
- Notificación inmediata cuando se libera cupo
- Tiempo límite de 48 horas para confirmar

### Comunicaciones Automáticas

#### Emails de Confirmación
**Contenido Incluye:**
- Detalles completos de la actividad
- Ubicación exacta y cómo llegar
- Horarios y fechas de sesiones
- Información del instructor
- Requisitos y materiales necesarios
- Contacto para dudas o cancelaciones

#### Recordatorios
- **24 horas antes**: Primera sesión
- **2 horas antes**: Cada sesión regular
- **Cambios**: Notificación inmediata de modificaciones
- **Cancelaciones**: Aviso con opciones alternatives

### Reportes y Estadísticas

#### Métricas por Actividad
- **Ocupación**: Porcentaje de cupo utilizado
- **Lista de Espera**: Demanda no cubierta
- **Asistencia Real**: Participantes que efectivamente asisten
- **Satisfacción**: Evaluaciones post-actividad

#### Análisis de Participación
- **Demografía**: Edad, género, ubicación de participantes
- **Preferencias**: Categorías más demandadas
- **Comportamiento**: Patrones de inscripción y asistencia
- **Retención**: Participantes que repiten actividades
        `},{id:"horarios",title:"Gestión de Horarios y Calendarios",level:1,content:`
### Sistema de Programación
La **Gestión de Horarios** permite crear calendarios flexibles y detallados para todas las actividades, considerando disponibilidad de espacios, instructores y recursos.

### Configuración de Horarios

#### Tipos de Programación
**🔄 Recurrente Regular:**
- Mismos días y horas cada semana
- Ejemplo: Lunes, Miércoles, Viernes 6:00 PM
- Duración fija por sesión
- Fechas de inicio y fin definidas

**📅 Calendario Personalizado:**
- Fechas específicas no regulares
- Horarios variables por sesión
- Actividades de temporada o especiales
- Eventos únicos o esporádicos

**⚡ Intensivos:**
- Actividades concentradas en pocos días
- Ejemplo: Taller de fin de semana
- Mayor duración por sesión
- Formato tipo campamento o curso

### Herramientas de Programación

#### Vista de Calendario
**Características:**
- **Vista Mensual**: Panorámica general de actividades
- **Vista Semanal**: Detalle de horarios por día
- **Vista Diaria**: Programación específica por fecha
- **Filtros**: Por parque, instructor, categoría o actividad

#### Gestión de Conflictos
**Detección Automática:**
- Solapamiento de horarios del mismo instructor
- Uso simultáneo del mismo espacio
- Exceso de actividades en horario pico
- Conflictos con mantenimiento de instalaciones

**Resolución Asistida:**
- Sugerencias de horarios alternativos
- Notificaciones a instructores afectados
- Reprogramación automática cuando sea posible
- Alertas para administradores

### Administración de Espacios

#### Asignación de Ubicaciones
**Por Actividad:**
- Espacios techados vs. al aire libre
- Capacidad del área vs. participantes esperados
- Requisitos especiales (agua, electricidad, etc.)
- Proximidad a servicios (baños, estacionamiento)

**Control de Disponibilidad:**
- Calendario de mantenimiento
- Eventos especiales que afecten disponibilidad
- Condiciones climáticas (para espacios exteriores)
- Reservas de terceros o eventos municipales

### Flexibilidad Operativa

#### Cambios y Reprogramaciones
**Proceso Controlado:**
1. **Identificar Necesidad**: Cambio solicitado o imprevisto
2. **Evaluar Impact**: Participantes, instructor, espacio afectados
3. **Proponer Alternativas**: Nuevos horarios disponibles
4. **Comunicar Cambios**: Notificación a todos los involucrados
5. **Confirmar Aceptación**: Validar que el cambio es viable

#### Cancelaciones Excepcionales
**Causas Comunes:**
- Condiciones climáticas adversas
- Enfermedad del instructor
- Problemas en las instalaciones
- Emergencias o eventos imprevisto

**Protocolo de Cancelación:**
- Notificación inmediata a participantes
- Opciones de reprogramación
- Política de reembolsos (si aplica)
- Registro del motivo para estadísticas

### Optimización de Recursos

#### Análisis de Utilización
**Métricas Clave:**
- **Ocupación por Horario**: Identificar picos y valles
- **Utilización de Espacios**: Eficiencia de instalaciones
- **Carga de Instructores**: Distribución equitativa
- **Preferencias Ciudadanas**: Horarios más demandados

#### Recomendaciones Automáticas
**El sistema sugiere:**
- Horarios alternativos para nuevas actividades
- Redistribución para mejor aprovechamiento
- Identificación de espacios subutilizados
- Oportunidades para ampliar oferta en horarios populares
        `},{id:"reportes",title:"Reportes y Análisis",level:1,content:`
### Dashboard Ejecutivo
El **Sistema de Reportes** proporciona insights valiosos sobre el desempeño del programa de actividades, participación ciudadana y utilización de recursos.

### Métricas Principales

#### 📊 Indicadores Clave (KPIs)
**Participación:**
- **Total de Actividades**: Cantidad de programas ofrecidos
- **Participantes Únicos**: Ciudadanos diferentes que participan
- **Sesiones Realizadas**: Encuentros efectivamente realizados
- **Tasa de Ocupación**: Porcentaje de cupos utilizados

**Satisfacción:**
- **Calificación Promedio**: Evaluaciones de participantes (1-5 estrellas)
- **Actividades Mejor Calificadas**: Top 10 por satisfacción
- **Índice de Retención**: Participantes que repiten actividades
- **Recomendaciones**: Porcentaje de participantes que recomendarían

#### 📈 Análisis de Tendencias
**Participación por Período:**
- Evolución mensual de inscripciones
- Estacionalidad en diferentes tipos de actividades
- Comparativas año con año
- Proyecciones basadas en tendencias históricas

**Demografía de Participantes:**
- Distribución por rangos de edad
- Participación por género
- Procedencia geográfica (colonias, municipios)
- Preferencias por categoría de actividad

### Reportes Especializados

#### 🎯 Por Categoría de Actividad
**Análisis Comparativo:**
- **Deportivas**: Participación, horarios preferidos, espacios más utilizados
- **Culturales**: Talleres más populares, necesidad de materiales, creatividad mostrada
- **Educativas**: Efectividad del aprendizaje, continuidad en cursos
- **Familiares**: Composición de grupos, satisfacción intergeneracional
- **Ambientales**: Impacto en conciencia ecológica, proyectos realizados

#### 🏞️ Por Parque
**Desempeño por Ubicación:**
- Número total de actividades por parque
- Participación promedio por ubicación
- Categorías más exitosas en cada espacio
- Utilización de instalaciones específicas
- Análisis de accesibilidad y transporte

#### 👨‍🏫 Por Instructor
**Evaluación de Desempeño:**
- Actividades impartidas por período
- Calificaciones promedio recibidas
- Número total de participantes impactados
- Especialidades más demandadas
- Desarrollo profesional y capacitación

### Herramientas de Análisis

#### Filtros Avanzados
**Segmentación Temporal:**
- Filtro por fechas específicas
- Comparación entre períodos
- Análisis estacional
- Tendencias a largo plazo

**Segmentación Geográfica:**
- Por parque individual
- Por zona de la ciudad
- Por accesibilidad (transporte público)
- Por demografía del área

#### Exportación de Datos
**Formatos Disponibles:**
- **Excel**: Análisis detallado y pivot tables
- **PDF**: Reportes ejecutivos presentables
- **CSV**: Integración con otros sistemas
- **JSON**: Integración con APIs externas

### Análisis Predictivo

#### Proyecciones de Demanda
**Factores Considerados:**
- Tendencias históricas de participación
- Estacionalidad por tipo de actividad
- Crecimiento demográfico del área
- Nuevas instalaciones o mejoras planificadas

#### Recomendaciones Estratégicas
**El sistema sugiere:**
- Nuevas categorías de actividades basadas en gaps identificados
- Horarios alternativos para maximizar participación
- Parques con potencial para ampliar oferta
- Instructores especializados necesarios para cubrir demanda

### Impacto Social

#### Indicadores de Beneficio Comunitario
**Medición Cuantitativa:**
- **Cobertura Poblacional**: Porcentaje de ciudadanos que participan
- **Inclusión**: Diversidad demográfica en participantes
- **Accesibilidad**: Facilidad de acceso para diferentes grupos
- **Continuidad**: Participantes que mantienen actividad regular

**Medición Cualitativa:**
- Testimonios y casos de éxito documentados
- Mejoras en salud y bienestar reportadas
- Desarrollo de habilidades y talentos
- Fortalecimiento de vínculos comunitarios

### Benchmarking

#### Comparación con Estándares
**Referentes Nacionales:**
- Sistemas similares en otras ciudades mexicanas
- Mejores prácticas documentadas
- Indicadores de ciudades modelo

**Referentes Internacionales:**
- Programas exitosos en Latinoamérica
- Estándares ONU para espacios públicos
- Innovations en gestión de parques urbanos
        `},{id:"mejores-practicas",title:"Mejores Prácticas y Recomendaciones",level:1,content:`
### Planificación Estratégica

#### Desarrollo de Programación
**Principios Fundamentales:**
1. **Diversidad**: Ofrecer actividades para todos los gustos y edades
2. **Inclusión**: Considerar necesidades especiales y diferentes capacidades
3. **Calidad**: Priorizar instructores capacitados y materiales adecuados
4. **Sostenibilidad**: Actividades que puedan mantenerse a largo plazo

**Proceso de Planificación:**
- **Diagnóstico**: Análisis de necesidades comunitarias
- **Oferta Balanceada**: Mix equilibrado entre categorías
- **Recursos Disponibles**: Evaluación realista de capacidades
- **Evaluación Continua**: Ajustes basados en resultados

#### Gestión de Recursos Humanos
**Selección de Instructores:**
1. **Criterios Técnicos**: Certificaciones y experiencia relevante
2. **Habilidades Pedagógicas**: Capacidad de transmitir conocimiento
3. **Valores**: Alineación con misión del programa
4. **Flexibilidad**: Adaptación a diferentes grupos y situaciones

**Desarrollo Continuo:**
- Capacitación regular en nuevas metodologías
- Intercambio de experiencias entre instructores
- Evaluación 360° (participantes, pares, supervisores)
- Plan de carrera y reconocimientos

### Comunicación Efectiva

#### Promoción de Actividades
**Canales Múltiples:**
- **Redes Sociales**: Instagram, Facebook, TikTok para audiencias jóvenes
- **WhatsApp**: Grupos por colonias y tipos de actividades
- **Carteles**: En parques, centros comunitarios y espacios públicos
- **Radio Local**: Programas matutinos y de tarde

**Mensajes Clave:**
- Beneficios específicos de cada actividad
- Facilidad de inscripción y participación
- Testimonios de participantes satisfechos
- Información clara sobre horarios y ubicaciones

#### Gestión de Expectativas
**Comunicación Clara:**
- Descripción precisa del nivel requerido
- Materiales que debe aportar el participante
- Política de faltas y cancelaciones
- Certificaciones o reconocimientos a obtener

### Gestión Operativa

#### Control de Calidad
**Estándares Mínimos:**
- Puntualidad y asistencia del instructor
- Materiales y equipos en buen estado
- Espacios limpios y seguros
- Seguimiento de protocolos de seguridad

**Monitoreo Continuo:**
- Visitas aleatorias a actividades en curso
- Encuestas regulares de satisfacción
- Buzón de sugerencias y quejas
- Reuniones periódicas con instructores

#### Gestión de Crisis
**Situaciones Comunes y Respuestas:**
- **Clima Adverso**: Protocolos para actividades exteriores
- **Ausencia de Instructor**: Instructores de respaldo capacitados
- **Accidentes Menores**: Primeros auxilios y seguimiento
- **Baja Participación**: Estrategias de revitalización

### Innovación y Mejora Continua

#### Incorporación de Tecnología
**Herramientas Digitales:**
- Apps móviles para inscripciones y seguimiento
- Plataformas de video para actividades híbridas
- Gamificación para aumentar engagement
- Analytics para optimizar programación

#### Adaptación a Nuevas Tendencias
**Monitoreo de Tendencias:**
- Seguimiento de redes sociales y tendencias fitness
- Feedback continuo de participantes jóvenes
- Investigación de programas exitosos en otras ciudades
- Experimentación controlada con nuevos formatos

### Sostenibilidad del Programa

#### Financiera
**Estrategias de Financiamiento:**
- Diversificación de fuentes (gubernamental, privada, internacional)
- Actividades autofinanciables para subsidiar programas gratuitos
- Alianzas con empresas para patrocinio
- Aplicación a fondos nacionales e internacionales

#### Ambiental
**Prácticas Eco-Amigables:**
- Preferencia por materiales reutilizables
- Actividades que promuevan conciencia ambiental
- Uso eficiente de recursos (agua, electricidad)
- Conexión con la naturaleza en espacios verdes

#### Social
**Construcción de Comunidad:**
- Eventos especiales que integren diferentes actividades
- Reconocimiento público a participantes destacados
- Oportunidades de liderazgo para participantes avanzados
- Vínculos con organizaciones comunitarias locales
        `},{id:"faq",title:"Preguntas Frecuentes",level:1,content:`
### Gestión General

**P: ¿Cómo accedo al módulo de Actividades?**
R: Inicie sesión en ParkSys, vaya al sidebar administrativo, expanda "Actividades" y seleccione el submenu requerido según sus permisos asignados.

**P: ¿Puedo gestionar actividades de múltiples parques simultáneamente?**
R: Sí, el sistema permite filtrar por múltiples parques o ver todas las actividades del sistema en una vista unificada.

**P: ¿Con qué frecuencia se actualizan los datos en el dashboard?**
R: Los datos se actualizan en tiempo real. Las métricas reflejan información hasta el último registro ingresado.

### Creación y Gestión de Actividades

**P: ¿Qué información es obligatoria para crear una nueva actividad?**
R: Nombre, descripción, categoría, instructor asignado, parque donde se realizará, horarios y capacidad máxima son campos obligatorios.

**P: ¿Puedo duplicar una actividad existente?**
R: Sí, use la función "Duplicar" para crear una copia y luego modifique las fechas, horarios o detalles específicos según sea necesario.

**P: ¿Cómo cambio el instructor de una actividad?**
R: Desde la edición de la actividad, seleccione un nuevo instructor del dropdown. El sistema verificará disponibilidad de horarios automáticamente.

**P: ¿Puedo subir múltiples imágenes por actividad?**
R: Sí, cada actividad puede tener una imagen principal y hasta 5 imágenes adicionales en la galería.

### Gestión de Instructores

**P: ¿Cómo invito a un nuevo instructor?**
R: En la sección Instructores, use "Nuevo Instructor", ingrese los datos básicos y el sistema enviará automáticamente un email de invitación con enlace de registro.

**P: ¿Qué hago si un instructor no recibe el email de invitación?**
R: Verifique que el email sea correcto, revise carpeta de spam, y puede reenviar la invitación desde el panel administrativo.

**P: ¿Cómo evalúan los ciudadanos a los instructores?**
R: Los participantes reciben automáticamente un enlace de evaluación al finalizar la actividad, donde pueden calificar diferentes aspectos del desempeño.

### Inscripciones y Participantes

**P: ¿Cómo manejo las listas de espera?**
R: El sistema maneja automáticamente las listas de espera. Cuando se libera un cupo, notifica automáticamente al siguiente en lista con 48 horas para confirmar.

**P: ¿Puedo modificar datos de un participante inscrito?**
R: Sí, desde el panel de inscripciones de cada actividad puede editar la información de contacto y otros datos relevantes.

**P: ¿Cómo proceso reembolsos para actividades canceladas?**
R: En el panel de gestión de pagos, seleccione las inscripciones afectadas y use la función "Procesar Reembolso" con la justificación correspondiente.

### Categorías y Organización

**P: ¿Puedo crear nuevas categorías de actividades?**
R: Sí, en la sección Categorías puede crear nuevos tipos con nombre, descripción, color identificativo e ícono representativo.

**P: ¿Cómo reorganizo las categorías existentes?**
R: Use la función "Reorganizar" para cambiar el orden de aparición tanto en el panel administrativo como en el portal público.

**P: ¿Puedo tener subcategorías?**
R: Actualmente el sistema maneja un nivel de categorización. Para mayor especificidad, use tags o palabras clave en la descripción.

### Horarios y Programación

**P: ¿Cómo evito conflictos de horarios entre actividades?**
R: El sistema detecta automáticamente conflictos cuando se programa una actividad. Recibirá alertas si hay solapamiento de instructores o espacios.

**P: ¿Puedo programar actividades irregulares (no semanales)?**
R: Sí, use el modo "Calendario Personalizado" para actividades con fechas específicas no regulares.

**P: ¿Qué hago si necesito cancelar una sesión por mal clima?**
R: Use la función "Cancelar Sesión" especificando el motivo. El sistema notificará automáticamente a todos los participantes y sugerirá fechas de reposición.

### Reportes y Análisis

**P: ¿Cómo genero un reporte de participación mensual?**
R: En la sección Reportes, seleccione el rango de fechas, filtre por parques o categorías según necesite, y exporte en el formato deseado (Excel/PDF).

**P: ¿Puedo ver qué actividades tienen mayor demanda?**
R: Sí, el dashboard muestra métricas de ocupación y hay reportes específicos de "Actividades Más Demandadas" con análisis de listas de espera.

**P: ¿Cómo mido la satisfacción de los participantes?**
R: El sistema recopila automáticamente evaluaciones post-actividad y las presenta en métricas consolidadas por instructor, actividad y período.

### Problemas Técnicos

**P: ¿Por qué no puedo editar cierta actividad?**
R: Verifique sus permisos de usuario. Es posible que solo tenga permisos de lectura o acceso limitado a ciertos parques o categorías.

**P: Las notificaciones por email no se están enviando, ¿qué reviso?**
R: Verifique la configuración del servidor de email en configuraciones del sistema y contacte al administrador técnico si persiste el problema.

**P: ¿Cómo restauro una actividad eliminada accidentalmente?**
R: Solo usuarios con permisos de Super Administrador pueden recuperar registros eliminados. Contacte inmediatamente al soporte técnico con los detalles específicos.
        `},{id:"soporte",title:"Soporte Técnico y Contacto",level:1,content:`
### Canales de Comunicación

#### Soporte Inmediato
- **Chat en Vivo**: Disponible en horario de oficina (8:00 AM - 6:00 PM)
- **Teléfono**: +52 (33) 1234-5678 ext. 200
- **WhatsApp Business**: +52 (33) 9876-5432

#### Soporte por Email
- **Técnico**: soporte.actividades@guadalajara.gob.mx
- **Administrativo**: admin.actividades@guadalajara.gob.mx
- **Instructores**: instructores.parksys@guadalajara.gob.mx
- **Urgencias**: urgencias.parksys@guadalajara.gob.mx

### Procedimiento de Reporte de Problemas

#### Información Requerida para Tickets
1. **Usuario**: Nombre completo y rol en el sistema
2. **Módulo Afectado**: Actividades específicas o sección general
3. **Fecha/Hora**: Cuándo ocurrió el problema
4. **Acción Realizada**: Qué estaba intentando hacer específicamente
5. **Error Observado**: Mensaje exacto o comportamiento anormal
6. **Navegador/Dispositivo**: Especificaciones técnicas
7. **Screenshots**: Capturas que muestren el problema claramente

#### Categorías de Prioridad

**🔴 Crítica (Respuesta en 1 hora):**
- Sistema de actividades completamente inaccesible
- Pérdida confirmada de inscripciones o datos de participantes
- Problemas de seguridad en información de instructores
- Fallas en sistema de pagos que afecten ingresos

**🟠 Alta (Respuesta en 4 horas):**
- Funcionalidades principales no disponibles
- Errores en generación de reportes importantes
- Problemas con notificaciones automáticas
- Conflictos en programación de horarios

**🟡 Media (Respuesta en 24 horas):**
- Funcionalidades específicas con problemas menores
- Errores de interfaz que no impiden operación
- Solicitudes de mejoras en flujos existentes
- Problemas de rendimiento no críticos

**🟢 Baja (Respuesta en 72 horas):**
- Consultas sobre uso correcto del sistema
- Solicitudes de capacitación adicional
- Sugerencias de nuevas funcionalidades
- Reportes de errores cosméticos menores

### Recursos de Capacitación

#### Documentación Disponible
- **Manual Completo**: Este documento actualizado mensualmente
- **Videos Tutoriales**: Biblioteca en el portal interno
- **Casos de Uso**: Ejemplos prácticos paso a paso
- **FAQ Extendida**: Preguntas más frecuentes con respuestas detalladas

#### Capacitación Presencial
- **Sesiones Grupales**: Mensuales para nuevos usuarios
- **Capacitación Especializada**: Para administradores avanzados
- **Talleres Temáticos**: Según necesidades específicas identificadas
- **Soporte en Sitio**: Disponible para implementaciones complejas

### Acuerdos de Nivel de Servicio (SLA)

#### Disponibilidad del Sistema
- **Objetivo**: 99.5% de uptime mensual para módulo de Actividades
- **Horario Crítico**: 6:00 AM - 10:00 PM todos los días
- **Mantenimiento Programado**: Domingos 2:00 AM - 4:00 AM con aviso previo
- **Tiempo de Respuesta**: < 2 segundos para operaciones básicas

#### Soporte de Usuarios
- **Horario de Atención**: Lunes a viernes 8:00 AM - 6:00 PM
- **Emergencias**: 24/7 solo para problemas críticos
- **Resolución**: 90% de tickets resueltos dentro del SLA establecido
- **Satisfacción**: Meta de 95% de satisfacción en encuestas de servicio

### Contactos Especializados

#### Equipo de Actividades
- **Coordinador General**: coord.actividades@guadalajara.gob.mx
- **Responsable Técnico**: tech.actividades@guadalajara.gob.mx
- **Gestión de Instructores**: instructores.coord@guadalajara.gob.mx

#### Escalación de Problemas
**Nivel 1**: Soporte técnico general
**Nivel 2**: Especialistas en módulo de actividades
**Nivel 3**: Arquitectos de sistema y desarrollo
**Nivel 4**: Dirección técnica y toma de decisiones críticas

### Mejora Continua

#### Feedback del Usuario
- **Encuestas Trimestrales**: Evaluación de satisfacción y necesidades
- **Grupos Focales**: Sesiones con usuarios avanzados
- **Buzón de Sugerencias**: Canal permanente para ideas de mejora
- **Beta Testing**: Participación en pruebas de nuevas funcionalidades

#### Actualizaciones del Sistema
- **Versiones Menores**: Cada 2 semanas con correcciones y mejoras menores
- **Versiones Mayores**: Cada 3-4 meses con nuevas funcionalidades
- **Hotfixes**: Dentro de 24 horas para problemas críticos
- **Comunicación**: Notificación previa de todos los cambios importantes
        `}]}};function wa({documentId:a,onBack:e}){const[i,t]=I.useState(""),[s,r]=I.useState(""),[d,n]=I.useState([]),l=Aa[a];if(I.useEffect(()=>{if(!l)return;const c=l.sections.filter(m=>m.title.toLowerCase().includes(i.toLowerCase())||m.content.toLowerCase().includes(i.toLowerCase()));n(c),c.length>0&&!s&&r(c[0].id)},[l,i,s]),!l)return u.jsx(V,{className:"max-w-4xl mx-auto",children:u.jsxs(B,{className:"p-8 text-center",children:[u.jsx(Ie,{className:"h-12 w-12 mx-auto mb-4 text-gray-400"}),u.jsx("h3",{className:"text-lg font-medium text-gray-900 mb-2",children:"Documento no encontrado"}),u.jsx("p",{className:"text-gray-600 mb-4",children:"El documento solicitado no está disponible."}),e&&u.jsxs(re,{onClick:e,variant:"outline",children:[u.jsx(oe,{className:"h-4 w-4 mr-2"}),"Volver"]})]})});const o=d.find(c=>c.id===s)||d[0];return u.jsxs("div",{className:"max-w-7xl mx-auto p-6",children:[u.jsxs("div",{className:"flex items-center justify-between mb-6",children:[u.jsxs("div",{className:"flex items-center gap-3",children:[e&&u.jsxs(re,{onClick:e,variant:"outline",size:"sm",children:[u.jsx(oe,{className:"h-4 w-4 mr-2"}),"Volver"]}),l.icon,u.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:l.title})]}),u.jsxs("div",{className:"relative w-80",children:[u.jsx(Te,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"}),u.jsx(je,{placeholder:"Buscar en el documento...",value:i,onChange:c=>t(c.target.value),className:"pl-10"})]})]}),u.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-6",children:[u.jsx("div",{className:"lg:col-span-1",children:u.jsxs(V,{className:"sticky top-6",children:[u.jsx(ce,{children:u.jsxs(le,{className:"text-lg flex items-center gap-2",children:[u.jsx(De,{className:"h-4 w-4"}),"Índice"]})}),u.jsx(B,{className:"p-0",children:u.jsx(de,{className:"h-[600px]",children:u.jsx("div",{className:"p-4 space-y-2",children:d.map(c=>u.jsx("button",{onClick:()=>r(c.id),className:`w-full text-left p-2 rounded-md text-sm transition-colors ${s===c.id?"bg-primary text-primary-foreground":"hover:bg-gray-100"}`,children:u.jsxs("div",{className:"flex items-center gap-2",children:[u.jsx(Fe,{className:"h-3 w-3"}),c.title]})},c.id))})})})]})}),u.jsx("div",{className:"lg:col-span-3",children:u.jsxs(V,{children:[u.jsx(ce,{children:u.jsxs(le,{className:"flex items-center gap-2",children:[u.jsx(Me,{className:"h-5 w-5"}),o==null?void 0:o.title]})}),u.jsx(B,{children:u.jsx(de,{className:"h-[600px]",children:u.jsx("div",{className:"prose prose-gray max-w-none",children:u.jsx("div",{dangerouslySetInnerHTML:{__html:Pa((o==null?void 0:o.content)||"")}})})})})]})})]})]})}export{wa as D};
