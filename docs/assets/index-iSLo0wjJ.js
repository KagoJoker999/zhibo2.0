import{X as Bt}from"./vendor-xlsx-DkFutVy2.js";import{c as Mt}from"./vendor-supabase-NqpLMp-i.js";import{c as At,i as Dt}from"./vendor-lucide-CLinycet.js";import{C as lt,r as zt}from"./vendor-chart-DU5eDjOK.js";(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();lt.register(...zt);function pe(){if(!window.supabaseClient)throw new Error("Supabase 未初始化");return window.supabaseClient}async function Pt(e,a={}){console.log(`📖 [DB查询] 表: ${e}`,a.filters?`筛选: ${JSON.stringify(a.filters)}`:"");let n=pe().from(e).select(a.select||"*");if(a.filters)for(const[i,s]of Object.entries(a.filters))n=n.eq(i,s);a.orderBy&&(n=n.order(a.orderBy.column,{ascending:a.orderBy.ascending??!0})),a.limit&&(n=n.limit(a.limit)),a.offset&&(n=n.range(a.offset,a.offset+(a.limit||10)-1));const{data:r,error:o}=await n;if(o)throw console.error(`<i data-lucide="x-circle"></i> [DB查询失败] 表: ${e}`,o.message),o;return console.log(`<i data-lucide="check-circle"></i> [DB查询完成] 表: ${e}, 返回 ${(r==null?void 0:r.length)||0} 条记录`),r}async function Nt(e,a){const t=Array.isArray(a)?a.length:1;console.log(`✏️ [DB插入] 表: ${e}, 数据量: ${t} 条`);const n=pe(),{data:r,error:o}=await n.from(e).insert(a).select();if(o)throw console.error(`<i data-lucide="x-circle"></i> [DB插入失败] 表: ${e}`,o.message),o;return console.log(`<i data-lucide="check-circle"></i> [DB插入完成] 表: ${e}, 成功 ${(r==null?void 0:r.length)||0} 条`),r}async function Ut(e,a,t){console.log(`📝 [DB更新] 表: ${e}, 筛选: ${JSON.stringify(t)}`);let r=pe().from(e).update(a);for(const[s,l]of Object.entries(t))r=r.eq(s,l);const{data:o,error:i}=await r.select();if(i)throw console.error(`<i data-lucide="x-circle"></i> [DB更新失败] 表: ${e}`,i.message),i;return console.log(`<i data-lucide="check-circle"></i> [DB更新完成] 表: ${e}, 影响 ${(o==null?void 0:o.length)||0} 条`),o}async function qt(e,a){console.log(`🗑️ [DB删除] 表: ${e}, 筛选: ${JSON.stringify(a)}`);let n=pe().from(e).delete();for(const[o,i]of Object.entries(a))n=n.eq(o,i);const{error:r}=await n;if(r)throw console.error(`<i data-lucide="x-circle"></i> [DB删除失败] 表: ${e}`,r.message),r;return console.log(`<i data-lucide="check-circle"></i> [DB删除完成] 表: ${e}`),!0}async function ct(e){console.log(`🧹 [DB清空] 表: ${e}`);const a=pe(),{error:t}=await a.from(e).delete().neq("id",0);if(t)throw console.error(`<i data-lucide="x-circle"></i> [DB清空失败] 表: ${e}`,t.message),t;return console.log(`<i data-lucide="check-circle"></i> [DB清空完成] 表: ${e}`),!0}async function Rt(e,a,t=!1){console.log(`<i data-lucide="package"></i> [DB批量插入] 表: ${e}, 数据量: ${(a==null?void 0:a.length)||0} 条, 全量替换: ${t}`),t&&await ct(e);const n=pe(),{data:r,error:o}=await n.from(e).insert(a).select();if(o)throw console.error(`<i data-lucide="x-circle"></i> [DB批量插入失败] 表: ${e}`,o.message),o;return console.log(`<i data-lucide="check-circle"></i> [DB批量插入完成] 表: ${e}, 成功 ${(r==null?void 0:r.length)||0} 条`),r}window.SupabaseClient={query:Pt,insert:Nt,update:Ut,delete:qt,truncate:ct,batchInsert:Rt,get client(){return window.supabaseClient}};const G={currentPage:"welcome",isLoading:!1,sidebarOpen:!1},X={sidebar:document.getElementById("sidebar"),menuToggle:document.getElementById("menuToggle"),contentBody:document.getElementById("contentBody"),welcomeSection:document.getElementById("welcomeSection"),pageContainer:document.getElementById("pageContainer"),toastContainer:document.getElementById("toastContainer"),loadingOverlay:document.getElementById("loadingOverlay"),statusIndicator:document.getElementById("statusIndicator")},Ke={welcome:{title:"欢迎使用",icon:'<i data-lucide="rocket"></i>'},upload:{title:"上传功能",icon:'<i data-lucide="upload"></i>'},"upload-ranking":{title:"排名数据上传",icon:'<i data-lucide="upload"></i>'},"upload-product-id":{title:"商品 ID 上传",icon:'<i data-lucide="upload"></i>'},"upload-inventory":{title:"库存数据上传",icon:'<i data-lucide="upload"></i>'},arrangement:{title:"排品功能",icon:'<i data-lucide="clipboard-list"></i>'},"arrangement-upload":{title:"基础数据上传",icon:'<i data-lucide="clipboard-list"></i>'},"arrangement-main":{title:"排品功能",icon:'<i data-lucide="clipboard-list"></i>'},"arrangement-settings":{title:"排品设置",icon:'<i data-lucide="clipboard-list"></i>'},"arrangement-assignment":{title:"排品序号分配",icon:'<i data-lucide="binary"></i>'},"arrangement-exclusion":{title:"排除商品设置",icon:'<i data-lucide="ban"></i>'},"arrangement-check":{title:"排品检查",icon:'<i data-lucide="search-check"></i>'},"arrangement-scoring":{title:"评分设置",icon:'<i data-lucide="settings-2"></i>'},"arrangement-mapping":{title:"对照表生成",icon:'<i data-lucide="clipboard-list"></i>'},"new-product":{title:"新品处理",icon:'<i data-lucide="sparkles"></i>'},"new-product-upload":{title:"新品数据上传",icon:'<i data-lucide="sparkles"></i>'},"new-product-process":{title:"新品数据处理",icon:'<i data-lucide="sparkles"></i>'},"new-product-download":{title:"新品数据下载",icon:'<i data-lucide="sparkles"></i>'},"new-product-settings":{title:"新品处理设置",icon:'<i data-lucide="sparkles"></i>'},"new-product-rules":{title:"新品序号分配",icon:"🔢"},"new-product-links":{title:"新品链接",icon:'<i data-lucide="link-2"></i>'},"welfare-ranking":{title:"福利排品",icon:'<i data-lucide="gift"></i>'},coupon:{title:"发券品处理",icon:'<i data-lucide="ticket"></i>'},"coupon-upload":{title:"发券品数据上传",icon:'<i data-lucide="ticket"></i>'},"coupon-process":{title:"发券品数据处理",icon:'<i data-lucide="ticket"></i>'},"coupon-download":{title:"发券品数据下载",icon:'<i data-lucide="ticket"></i>'},"coupon-settings":{title:"发券品处理设置",icon:'<i data-lucide="ticket"></i>'},mapping:{title:"排品结果推送",icon:'<i data-lucide="link"></i>'},"mapping-history":{title:"历史记录",icon:'<i data-lucide="history"></i>'},"mapping-settings":{title:"对照设置",icon:'<i data-lucide="settings"></i>'},"other-tools":{title:"其他功能",icon:'<i data-lucide="briefcase"></i>'},"livestream-additional-investment":{title:"追投计算",icon:'<i data-lucide="coins"></i>'},presale:{title:"关闭预售",icon:'<i data-lucide="clipboard-list"></i>'},shadowbot:{title:"影刀转换",icon:'<i data-lucide="bot"></i>'},"id-converter":{title:"ID 转换",icon:'<i data-lucide="refresh-cw"></i>'},"inventory-analysis":{title:"库存判断",icon:'<i data-lucide="package-search"></i>'}};document.addEventListener("DOMContentLoaded",()=>{if(window.lucide){let a;const t=()=>{clearTimeout(a),a=setTimeout(()=>{window.lucide.createIcons()},50)};t(),new MutationObserver(t).observe(document.body,{childList:!0,subtree:!0})}jt(),Ft(),Ot(),Ve(),dt(),setTimeout(()=>{window.updateInventoryReminder&&window.updateInventoryReminder()},200),setTimeout(()=>{window.loadQuickLinks&&window.loadQuickLinks()},100),window.addEventListener("hashchange",Ve),console.log("📡 辅助工具已启动");const e=document.createElement("img");e.id="hover-zoom-overlay",e.referrerPolicy="no-referrer",document.body.appendChild(e),document.body.addEventListener("mouseenter",function(a){const t=a.target.closest(".hover-zoom-container");if(!t)return;const n=t.querySelector(".hover-zoom-thumb");if(!n||!n.src)return;e.src=n.src,e.style.display="block";const r=t.getBoundingClientRect(),o=192,i=10;let s=r.right+i;s+o>window.innerWidth-8&&(s=r.left-o-i);let l=r.top+r.height/2-o/2;l=Math.max(8,Math.min(l,window.innerHeight-o-8)),e.style.left=s+"px",e.style.top=l+"px"},!0),document.body.addEventListener("mouseleave",function(a){const t=a.target.closest(".hover-zoom-container");if(!t)return;const n=a.relatedTarget;n&&t.contains(n)||(e.style.display="none")},!0)});async function dt(){const e=document.getElementById("dbUsage"),a=document.getElementById("dbUsageText");if(!e||!a)return;const t=(s,l)=>{a.textContent=l,s?(e.style.color="#00b42a",e.style.borderColor="rgba(0,180,42,0.3)"):(e.style.color="#f53f3f",e.style.borderColor="rgba(245,63,63,0.3)")};if(!window.supabaseClient){t(!1,"无法连接数据库");return}const n="db_usage_cache",r=1440*60*1e3,o=500;try{const s=localStorage.getItem(n);if(s){const{usedMB:l,timestamp:c}=JSON.parse(s);if(Date.now()-c<r){const p=(o-parseFloat(l)).toFixed(0);t(!0,`${l}MB / ${o}MB（剩余 ${p}MB）`);return}}}catch{}let i="0.0";try{const{data:s,error:l}=await window.supabaseClient.rpc("get_database_size");if(!l&&s&&s.size_mb!==void 0)i=parseFloat(s.size_mb).toFixed(2),console.log("📊 数据库大小（RPC）:",i,"MB");else{console.warn('<i data-lucide="alert-triangle"></i> RPC 获取数据库大小失败，使用估算方式:',l==null?void 0:l.message);const u=["inventory_data","product_id","new_product_data","ranking_config"];let p=0;for(const m of u){const{count:f,error:L}=await window.supabaseClient.from(m).select("*",{count:"exact",head:!0});if(L)throw L;p+=f||0}i=(p*.5/1024).toFixed(2)}const c=(o-parseFloat(i)).toFixed(0);try{localStorage.setItem(n,JSON.stringify({usedMB:i,timestamp:Date.now()}))}catch{}t(!0,`${i}MB / ${o}MB（剩余 ${c}MB）`)}catch(s){console.error('<i data-lucide="x-circle"></i> 获取数据库大小失败:',s),t(!1,"无法连接数据库")}}window.updateDbUsage=dt;async function Ht(){const e=document.getElementById("inventoryReminder");e&&(e.style.display="none")}window.updateInventoryReminder=Ht;function jt(){typeof supabase<"u"&&supabase.createClient?(window.supabaseClient=supabase.createClient("https://ugadhdhwixrejzfcwugj.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnYWRoZGh3aXhyZWp6ZmN3dWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzU3NTgsImV4cCI6MjA4MTgxMTc1OH0.XQp5pvoM-nSGfLZB9ZGfxJCkU3GbeiWrBohA_XchS54"),console.log('<i data-lucide="check-circle"></i> Supabase 客户端已初始化')):console.warn('<i data-lucide="alert-triangle"></i> Supabase SDK 尚未加载')}function Ft(){document.querySelectorAll(".nav-link, .nav-submenu a").forEach(a=>{a.addEventListener("click",t=>{const n=a.dataset.page||a.dataset.section,r=a.closest(".nav-item");if((r==null?void 0:r.querySelector(".nav-submenu"))&&a.classList.contains("nav-link")){if(t.preventDefault(),document.querySelectorAll(".nav-item.expanded").forEach(i=>{i!==r&&i.classList.remove("expanded")}),r.classList.toggle("expanded"),n==="other-tools")return;n&&Xe(n);return}n&&(t.preventDefault(),Xe(n))})})}function Xe(e){window.location.hash.slice(1)===e?(ut(e),pt(e)):window.location.hash=e,window.innerWidth<=768&&Pe(!1)}function Ve(){const e=window.location.hash.slice(1)||"upload";ut(e),pt(e)}function ut(e){document.querySelectorAll(".nav-link, .nav-submenu a").forEach(t=>{t.classList.remove("active")});const a=document.querySelector(`[data-page="${e}"]`)||document.querySelector(`[data-section="${e}"]`);if(a){a.classList.add("active");const t=a.closest(".nav-item");if(t){const n=t.querySelector(".nav-link");n&&n.classList.add("active")}}}function pt(e){const a=Ke[e]||Ke.welcome;if(document.title=`${a.title} - 辅助工具`,e==="welcome")X.welcomeSection.style.display="flex",X.pageContainer.style.display="none";else{X.welcomeSection.style.display="none",X.pageContainer.style.display="block";const t=document.querySelector(".placeholder-icon");if(t&&(t.innerHTML=a.icon,window.lucide&&window.lucide.createIcons()),window.loadUploadPage&&(e==="upload"||e.startsWith("upload-"))){const n=window.loadUploadPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadNewProductPage&&(e==="new-product"||e.startsWith("new-product-"))){const n=window.loadNewProductPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadRankingPage){let n=null;if(e==="arrangement"||e==="arrangement-main"?n="ranking":e==="arrangement-settings"||e==="arrangement-assignment"?n="ranking-settings":e==="arrangement-exclusion"?n="ranking-exclusion":e==="arrangement-check"?n="ranking-check":e==="arrangement-scoring"&&(n="ranking-scoring"),n){const r=window.loadRankingPage(n);if(r){X.pageContainer.innerHTML=r.html,setTimeout(()=>r.init(),50),G.currentPage=e;return}}}if(window.loadMappingPage&&(e==="mapping"||e.startsWith("mapping-"))){const n=window.loadMappingPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadWelfareRankingPage&&e==="welfare-ranking"){const n=window.loadWelfareRankingPage();if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadCouponPage&&(e==="coupon"||e.startsWith("coupon-"))){const n=window.loadCouponPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadInvestmentPage&&e==="livestream-additional-investment"){const n=window.loadInvestmentPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadPresalePage&&e==="presale"){const n=window.loadPresalePage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadShadowbotPage&&e==="shadowbot"){const n=window.loadShadowbotPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadIdConverterPage&&e==="id-converter"){const n=window.loadIdConverterPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}if(window.loadInventoryAnalysisPage&&e==="inventory-analysis"){const n=window.loadInventoryAnalysisPage(e);if(n){X.pageContainer.innerHTML=n.html,setTimeout(()=>n.init(),50),G.currentPage=e;return}}X.pageContainer.innerHTML=`
            <div class="placeholder-content">
                <div class="placeholder-icon">${a.icon}</div>
                <h3>${a.title}</h3>
                <p>此功能正在开发中，敬请期待...</p>
            </div>
        `}G.currentPage=e}function Ot(){var e;(e=X.menuToggle)==null||e.addEventListener("click",()=>{Pe()}),document.addEventListener("click",a=>{G.sidebarOpen&&!X.sidebar.contains(a.target)&&!X.menuToggle.contains(a.target)&&Pe(!1)})}function Pe(e){G.sidebarOpen=e??!G.sidebarOpen,X.sidebar.classList.toggle("open",G.sidebarOpen)}function Wt(e,a="info",t=3e3){const n=document.createElement("div");n.className=`toast ${a}`,n.textContent=e,X.toastContainer.appendChild(n),setTimeout(()=>{n.style.animation="slideIn 0.3s ease reverse",setTimeout(()=>n.remove(),300)},t)}function Kt(e,a='<i data-lucide="alert-triangle"></i>'){const t=document.querySelector(".center-alert-overlay");t&&t.remove();const n=document.createElement("div");n.className="center-alert-overlay",n.innerHTML=`
        <div class="center-alert">
            <div class="center-alert-icon">${a}</div>
            <div class="center-alert-message">${e}</div>
            <button class="center-alert-close">知道了</button>
        </div>
    `,document.body.appendChild(n),n.querySelector(".center-alert-close").addEventListener("click",()=>{n.style.animation="fadeIn 0.2s ease reverse",setTimeout(()=>n.remove(),200)}),n.addEventListener("click",o=>{o.target===n&&(n.style.animation="fadeIn 0.2s ease reverse",setTimeout(()=>n.remove(),200))})}function Xt(e,a,t="replace"){const n=document.querySelector(".replace-modal-overlay");n&&n.remove();const r=_=>{if(!_)return"未知商品";let S=_;return _.includes("「")&&(S=_.substring(_.indexOf("「"))),S.length>20?S.substring(0,20)+"...":S},o=r(e==null?void 0:e.name),i=r(a==null?void 0:a.name),s=(e==null?void 0:e.image)||"",l=(a==null?void 0:a.image)||"",c=t==="undo",u=c?"已撤回替换":"商品已替换",p=c?"↩️":"➡️",g=c?"rgba(34, 197, 94, 0.95)":"rgba(59, 130, 246, 0.95)",m=document.createElement("div");m.className="replace-modal-overlay",m.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    `,m.innerHTML=`
        <div class="replace-modal" style="
            background: ${g};
            border-radius: 16px;
            padding: 1.5rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        ">
            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">${u}</div>
            
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
                <!-- 被删除/原商品 -->
                <div style="flex: 1; text-align: center;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 0.5rem;
                        border-radius: 8px;
                        overflow: hidden;
                        background: rgba(255,255,255,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        ${s?`<img src="${s.split(",")[0].trim()}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem;\\'><i data-lucide="package"></i></span>'">`:'<span style="font-size: 2rem;"><i data-lucide="package"></i></span>'}
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.9; max-width: 120px; margin: 0 auto; word-break: break-all;">${o}</div>
                </div>
                
                <!-- 箭头 -->
                <div style="font-size: 2rem;">${p}</div>
                
                <!-- 补充的商品 -->
                <div style="flex: 1; text-align: center;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 0.5rem;
                        border-radius: 8px;
                        overflow: hidden;
                        background: rgba(255,255,255,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        ${l?`<img src="${l.split(",")[0].trim()}" style="width: 100%; height: 100%; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem;\\'><i data-lucide="package"></i></span>'">`:'<span style="font-size: 2rem;"><i data-lucide="package"></i></span>'}
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.9; max-width: 120px; margin: 0 auto; word-break: break-all;">${i}</div>
                </div>
            </div>
            
            <button class="replace-modal-close" style="
                margin-top: 1.25rem;
                padding: 0.5rem 2rem;
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 0.9rem;
                cursor: pointer;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">知道了 (10s)</button>
        </div>
    `,document.body.appendChild(m);let f=10;const L=m.querySelector(".replace-modal-close"),d=()=>{clearInterval(y),clearTimeout(b),m.style.animation="fadeIn 0.2s ease reverse",setTimeout(()=>{document.body.contains(m)&&m.remove()},200)};L.addEventListener("click",d),m.addEventListener("click",_=>{_.target===m&&d()});const y=setInterval(()=>{f--,f>=0?L.textContent=`知道了 (${f}s)`:clearInterval(y)},1e3),b=setTimeout(d,1e4)}function Vt(e="处理中..."){G.isLoading=!0,X.loadingOverlay.querySelector(".loading-text").textContent=e,X.loadingOverlay.classList.add("active")}function Qt(){G.isLoading=!1,X.loadingOverlay.classList.remove("active")}function Jt(e,a="ready"){const t=X.statusIndicator.querySelector(".status-dot"),n=X.statusIndicator.querySelector(".status-text");n.textContent=e;const r={ready:"var(--success-color)",processing:"var(--warning-color)",error:"var(--error-color)",info:"var(--info-color)"};t.style.background=r[a]||r.ready}function Yt(e){if(e===0)return"0 B";const a=1024,t=["B","KB","MB","GB"],n=Math.floor(Math.log(e)/Math.log(a));return parseFloat((e/Math.pow(a,n)).toFixed(2))+" "+t[n]}function Gt(e,a){let t;return function(...r){const o=()=>{clearTimeout(t),e(...r)};clearTimeout(t),t=setTimeout(o,a)}}function Zt(e,a="YYYY-MM-DD HH:mm:ss"){const t=new Date(e),n={YYYY:t.getFullYear(),MM:String(t.getMonth()+1).padStart(2,"0"),DD:String(t.getDate()).padStart(2,"0"),HH:String(t.getHours()).padStart(2,"0"),mm:String(t.getMinutes()).padStart(2,"0"),ss:String(t.getSeconds()).padStart(2,"0")};return a.replace(/YYYY|MM|DD|HH|mm|ss/g,r=>n[r])}window.AppUtils={showToast:Wt,showCenterAlert:Kt,showReplaceModal:Xt,showLoading:Vt,hideLoading:Qt,updateStatus:Jt,formatFileSize:Yt,debounce:Gt,formatDate:Zt};function mt(e){if(!e)return"";const a=String(e).trim();if(a.includes("「")){const t=a.indexOf("「");return a.substring(t)}return a}function ie(e){if(e==null)return 0;if(typeof e=="number")return isFinite(e)?e:0;const a=String(e).trim();if(!a||a.toLowerCase()==="nan"||a.toLowerCase()==="none")return 0;const t=a.replace(/[^\d.\-]/g,""),n=parseFloat(t);return isFinite(n)?n:0}function ea(e){if(e==null)return 0;const t=String(e).trim().replace(/[¥￥,，]/g,"");return ie(t)}function Qe(e){if(e==null)return 0;const a=String(e).trim();if(a.includes("%")){const t=a.replace("%","");return ie(t)/100}return ie(e)}function ta(e){console.log(`<i data-lucide="bar-chart-2"></i> [排名数据处理] 开始, 原始行数: ${(e==null?void 0:e.length)||0}`);const a=[];for(let t=1;t<e.length;t++){const n=e[t];if(!n||n.length===0)continue;const r=String(n[1]??"").trim();if(!r||r==="nan")continue;const o=mt(r),i=ea(n[5]);i<100||a.push({product_name:o,lecture_count:Math.round(ie(n[2])),sales_amount:i,exposure_rate:Qe(n[9]),conversion_rate:Qe(n[10])})}return console.log(`<i data-lucide="check-circle"></i> [排名数据处理] 完成, 有效记录: ${a.length} 条`),a}function aa(e){console.log(`<i data-lucide="package"></i> [库存数据处理] 开始, 原始行数: ${(e==null?void 0:e.length)||0}`);const a=new Map;for(let n=1;n<e.length;n++){const r=e[n];if(!r||r.length===0)continue;const o=String(r[1]??"").trim();if(!o||o==="nan")continue;a.has(o)||a.set(o,{image_url:"",virtual_category:new Set,product_code:new Set,warehouse:new Set,available_qty:0,actual_stock:0,product_category:new Set,product_tag:new Set});const i=a.get(o);if(!i.image_url){const l=String(r[0]??"").trim();l&&l!=="nan"&&(i.image_url=l)}const s=(l,c)=>{const u=String(c??"").trim();u&&u!=="nan"&&l.add(u)};s(i.virtual_category,r[3]),s(i.product_code,r[2]),s(i.warehouse,r[7]),s(i.product_category,r[4]),s(i.product_tag,r[5]),i.available_qty+=Math.round(ie(r[8])),i.actual_stock+=Math.round(ie(r[9]))}const t=[];return a.forEach((n,r)=>{t.push({product_name:r,image_url:n.image_url,virtual_category:Array.from(n.virtual_category).filter(Boolean).join(","),product_code:Array.from(n.product_code).filter(Boolean).join(","),warehouse:Array.from(n.warehouse).filter(Boolean).join(","),available_qty:n.available_qty,actual_stock:n.actual_stock,product_category:Array.from(n.product_category).filter(Boolean).join(","),_product_tag:Array.from(n.product_tag).filter(Boolean).join(",")})}),console.log(`<i data-lucide="check-circle"></i> [库存数据处理] 完成, 商品数: ${t.length}, 已合并同名商品`),t}function na(e){console.log(`<i data-lucide="tag"></i> [ID数据处理] 开始, 原始行数: ${(e==null?void 0:e.length)||0}`);const a=new Set,t=[];for(let n=1;n<e.length;n++){const r=e[n];if(!r||r.length===0)continue;const o=String(r[1]??"").trim();if(!o||o==="nan")continue;const i=mt(o);if(a.has(i))continue;a.add(i);let s=String(r[0]??"").trim();s.startsWith("ID:")&&(s=s.substring(3).trim());const l={product_name:i,product_id:s};r.length>13&&(l.product_price=ie(r[13]));let c=String(r[4]??"").trim();(!c||c==="nan")&&(c=String(r[3]??"").trim()),c&&c!=="nan"&&(l.store_category=c),t.push(l)}return console.log(`<i data-lucide="check-circle"></i> [ID数据处理] 完成, 有效记录: ${t.length} 条, 已去重`),t}const gt={ranking:{title:'<i data-lucide="bar-chart-2"></i> 排名上传 <span style="font-size: 0.75rem; background: rgba(220, 38, 38, 0.8); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: normal;">只需下播更新</span>',tableName:"ranking_data",processor:ta,rules:["商品名称：保留「字符及其后内容","讲解次数：转整数，无效值记0","成交金额：去除¥和逗号转数值","曝光/点击成交率：去%后÷100转小数","过滤：支付金额<100不导入"],mapping:[{source:"B列 商品名称",target:"product_name"},{source:"C列 讲解次数",target:"lecture_count"},{source:"F列 用户支付金额",target:"sales_amount"},{source:"J列 商品曝光-点击率",target:"exposure_rate"},{source:"K列 商品点击-成交转化率",target:"conversion_rate"}]},inventory:{title:'<i data-lucide="package"></i> 库存上传 <span style="font-size: 0.75rem; background: rgba(220, 38, 38, 0.8); padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: normal;">需先清空样品仓</span>',tableName:"inventory_data",processor:aa,rules:["同名商品自动合并","数值字段：相加","文本字段：去重合并"],mapping:[{source:"A列 图片",target:"image_url"},{source:"B列 商品名称",target:"product_name"},{source:"C列 商品编码",target:"product_code"},{source:"D列 虚拟分类",target:"virtual_category"},{source:"E列 分类",target:"product_category"},{source:"F列 商品标签",target:"product_tag (分类福利品)"},{source:"H列 主仓位",target:"warehouse"},{source:"I列 可用数",target:"available_qty"},{source:"J列 实际库存数",target:"actual_stock"}]},productId:{title:'<i data-lucide="tag"></i> ID上传',tableName:"product_id_data",processor:na,customMode:"productId",rules:["商品名称：保留「字符后部分",'商品ID：去除"ID:"前缀',"表格解析时按商品名称去重，保留首条","上传前选择店铺：1号至5号","上传时按商品ID去重，重复商品ID不上传"],mapping:[{source:"A列 商品ID",target:"product_id"},{source:"B列 商品名称",target:"product_name"},{source:"E列 三级分类",target:"store_category"},{source:"N列 商品价格",target:"product_price"},{source:"上传前选择",target:"shop"}]}};async function Be(e,a,t,n){try{const{error:r}=await window.supabaseClient.from("upload_history").insert({upload_type:e,file_name:a,record_count:t,upload_mode:n});r&&console.error("保存上传历史失败:",r)}catch(r){console.error("保存上传历史异常:",r)}}async function ra(e,a){const t=document.getElementById("uploadHistoryModal");t&&t.remove();const n=document.createElement("div");n.id="uploadHistoryModal",n.className="modal-overlay",n.innerHTML=`
        <div class="modal-content upload-history-modal">
            <div class="modal-header">
                <h3><i data-lucide="history"></i> ${a} - 最近上传记录</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body" id="uploadHistoryContent">
                <p class="text-muted">加载中...</p>
            </div>
        </div>
    `,document.body.appendChild(n),n.addEventListener("click",o=>{o.target===n&&n.remove()});const r=document.getElementById("uploadHistoryContent");try{const{data:o,error:i}=await window.supabaseClient.from("upload_history").select("*").eq("upload_type",e).order("created_at",{ascending:!1}).limit(10);if(i)throw i;if(!o||o.length===0){r.innerHTML='<p class="text-muted">暂无上传记录</p>';return}r.innerHTML=`
            <table class="history-table">
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>上传时间</th>
                        <th>商品数量</th>
                        <th>上传模式</th>
                    </tr>
                </thead>
                <tbody>
                    ${o.map(s=>`
                        <tr>
                            <td class="file-name">${s.file_name}</td>
                            <td>${oa(s.created_at)}</td>
                            <td><span class="record-count">${s.record_count}</span></td>
                            <td>${ia(s.upload_mode)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `,window.lucide&&window.lucide.createIcons()}catch(o){r.innerHTML=`<p class="text-error">加载失败: ${o.message}</p>`}}function oa(e){return new Date(e).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}function ia(e){return e==="full"?"更新全部":e==="incremental"?"补充上传":e==="upload"?"上传":e==="clear"?"清空表格":e||"-"}function sa(e,a){const t=a.mapping.map(s=>`<tr><td>${s.source}</td><td>→</td><td>${s.target}</td></tr>`).join(""),n=a.title.replace(/<[^>]*>/g,"").trim(),r=a.customMode==="productId",o=r?`
            <div class="product-id-shop-selector">
                <div class="product-id-shop-label">店铺</div>
                <div class="product-id-shop-options" id="shopOptions-${e}">
                    <button type="button" class="shop-option-btn" data-value="1">1号</button>
                    <button type="button" class="shop-option-btn" data-value="2">2号</button>
                    <button type="button" class="shop-option-btn" data-value="3">3号</button>
                    <button type="button" class="shop-option-btn" data-value="4">4号</button>
                    <button type="button" class="shop-option-btn" data-value="5">5号</button>
                    <input type="hidden" id="shopValue-${e}" value="">
                </div>
            </div>
        `:`
            <div class="toggle-group" id="modeToggle-${e}">
                <button type="button" class="toggle-btn active" data-value="full">更新全部</button>
                <button type="button" class="toggle-btn" data-value="incremental">补充上传</button>
                <input type="hidden" name="mode-${e}" value="full">
            </div>
        `,i=r?`
                <button class="btn btn-danger" id="clearBtn-${e}">清空表格</button>
                <button class="btn btn-primary btn-upload" id="uploadBtn-${e}" disabled>上传</button>
                <button class="btn btn-secondary btn-history" id="historyBtn-${e}"><i data-lucide="history"></i> 查看历史</button>
        `:`
                <button class="btn btn-primary btn-upload" id="uploadBtn-${e}" disabled>开始上传</button>
                <button class="btn btn-secondary btn-history" id="historyBtn-${e}"><i data-lucide="history"></i> 查看历史</button>
        `;return`
        <div class="upload-block" id="block-${e}">
            <div class="upload-block-header">
                <h3>${a.title} <span class="db-table-tag">→ ${a.tableName}</span></h3>
            </div>
            
            <div class="upload-zone" id="uploadZone-${e}">
                <div class="upload-zone-icon">📁</div>
                <p>拖拽文件到此处，或点击选择</p>
                <p class="upload-hint">.xlsx, .xls, .csv</p>
            </div>

            <div class="automation-upload-entry" data-upload-key="${e}">
                <label class="automation-upload-label" for="fileInput-${e}">
                    <i data-lucide="bot"></i>
                    自动化上传入口
                </label>
                <input
                    type="file"
                    id="fileInput-${e}"
                    class="automation-file-input"
                    accept=".xlsx,.xls,.csv"
                    data-automation-upload="${e}"
                    aria-label="${n} 自动化上传入口"
                >
                <div class="automation-upload-hint">影刀可直接定位此文件控件并设置文件路径</div>
            </div>
            
            ${o}
            
            <div class="upload-status" id="status-${e}" style="display:none">
                <div class="status-text" id="statusText-${e}">准备中...</div>
                <div class="progress-bar"><div class="progress-fill" id="progress-${e}"></div></div>
                <div class="status-detail" id="statusDetail-${e}"></div>
            </div>
            
            <div class="upload-actions-row">
                ${i}
            </div>
            
            <div class="last-upload-time" id="lastUploadTime-${e}"></div>
            
            <div class="upload-info-section" style="margin-top: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--text-secondary);">📖 上传说明</h4>
                <div class="upload-info-content" style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--border-radius-sm);">
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--text-secondary);"><i data-lucide="clipboard-list"></i> 处理规则</strong>
                        <ul style="margin: 0.5rem 0 0 1rem; padding: 0; font-size: 0.85rem; color: var(--text-muted);">
                            ${a.rules.map(s=>`<li>${s}</li>`).join("")}
                        </ul>
                    </div>
                    <div>
                        <strong style="color: var(--text-secondary);"><i data-lucide="link"></i> 字段映射</strong>
                        <table class="mapping-table" style="margin-top: 0.5rem; font-size: 0.8rem;">
                            <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                            <tbody>${t}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `}function la(){return`<div class="upload-page-combined"><div class="upload-blocks-grid">${Object.entries(gt).map(([a,t])=>sa(a,t)).join("")}</div></div>`}function ca(e,a){const t=document.getElementById(`uploadZone-${e}`),n=document.getElementById(`fileInput-${e}`),r=document.getElementById(`uploadBtn-${e}`),o=document.getElementById(`historyBtn-${e}`),i=document.getElementById(`status-${e}`),s=document.getElementById(`statusText-${e}`),l=document.getElementById(`progress-${e}`),c=document.getElementById(`statusDetail-${e}`),u=document.getElementById(`modeToggle-${e}`),p=u==null?void 0:u.querySelector('input[type="hidden"]'),g=document.getElementById(`clearBtn-${e}`),m=document.getElementById(`shopOptions-${e}`),f=document.getElementById(`shopValue-${e}`),L=a.customMode==="productId";let d=null;const y=document.getElementById(`lastUploadTime-${e}`);function b(v){y&&(y.textContent=v?`最后上传：${v}`:"")}const _=localStorage.getItem(`lastUpload_${e}`);_&&b(_);function S(){L?r.disabled=!d||!(f!=null&&f.value):r.disabled=!d}u==null||u.querySelectorAll(".toggle-btn").forEach(v=>{v.addEventListener("click",()=>{u.querySelectorAll(".toggle-btn").forEach(C=>C.classList.remove("active")),v.classList.add("active"),p.value=v.dataset.value})}),o==null||o.addEventListener("click",()=>{const v=a.title.replace(/<[^>]*>/g,"").trim();ra(e,v)}),m==null||m.querySelectorAll(".shop-option-btn").forEach(v=>{v.addEventListener("click",()=>{m.querySelectorAll(".shop-option-btn").forEach(C=>C.classList.remove("active")),v.classList.add("active"),f.value=v.dataset.value||"",S()})}),t.addEventListener("click",()=>n.click()),t.addEventListener("dragover",v=>{v.preventDefault(),t.classList.add("dragover")}),t.addEventListener("dragleave",()=>t.classList.remove("dragover")),t.addEventListener("drop",v=>{v.preventDefault(),t.classList.remove("dragover"),v.dataTransfer.files.length>0&&B(v.dataTransfer.files[0])}),n.addEventListener("change",v=>{v.target.files.length>0&&B(v.target.files[0])});function B(v){d=v,t.innerHTML=`<div class="upload-zone-icon"><i data-lucide="check-circle"></i></div><p><strong>${v.name}</strong></p>`,S(),window.lucide&&window.lucide.createIcons()}g==null||g.addEventListener("click",async()=>{var v,C,I,D;try{i.style.display="block",g.disabled=!0,r.disabled=!0,k("清空表格...",60),await Je(a.tableName),k("清空完成！",100),c.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 已清空 ${a.tableName}</span>`,await Be(e,"手动清空",0,"clear"),(C=(v=window.AppUtils)==null?void 0:v.showToast)==null||C.call(v,"ID表格已清空","success")}catch(M){console.error("清空表格失败:",M),s.textContent="清空失败",c.innerHTML=`<span class="error"><i data-lucide="x-circle"></i> ${M.message}</span>`,(D=(I=window.AppUtils)==null?void 0:I.showToast)==null||D.call(I,"清空失败: "+M.message,"error")}finally{g.disabled=!1,S()}}),r.addEventListener("click",async()=>{var I,D,M,P,h,$,A,N;if(!d)return;e==="inventory"&&((D=(I=window.AppUtils)==null?void 0:I.showToast)==null||D.call(I,"请确认已是清空样品仓后数据","warning"));const v=L?"upload":document.querySelector(`input[name="mode-${e}"]`).value,C=v==="full";console.log(`<i data-lucide="clipboard-list"></i> 上传模式: ${v}, isFullMode: ${C}`);try{i.style.display="block",r.disabled=!0,k("读取文件...",10);const q=await da(d);k("处理数据...",30);const j=a.processor(q);if(k(`已处理 ${j.length} 条`,50),j.length===0)throw new Error("无有效数据");if(L){const O=f==null?void 0:f.value;if(!O)throw new Error("请先选择店铺");j.forEach(E=>{E.shop=O}),k("检查重复商品ID...",60);const V=await pa(a.tableName,j);k("上传中...",75),V.newRecords.length>0&&await Ye(a.tableName,V.newRecords),k("完成！",100),c.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 新增 ${V.newRecords.length} 条，重复 ${V.duplicateCount} 条</span>`;const w=new Date().toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});localStorage.setItem(`lastUpload_${e}`,w),b(w),await Be(e,d.name,V.newRecords.length,v),(P=(M=window.AppUtils)==null?void 0:M.showToast)==null||P.call(M,`ID上传完成：新增 ${V.newRecords.length} 条，重复 ${V.duplicateCount} 条`,"success");return}let K=[];if(e==="inventory"){const O=[],V=[];j.forEach(x=>{const w=String(x._product_tag||"");delete x._product_tag,w.includes("福利")?V.push(x):O.push(x)}),K.push({tableName:a.tableName,records:O}),K.push({tableName:"welfare_inventory_data",records:V})}else K.push({tableName:a.tableName,records:j});if(C){console.log("🗑️ 开始清空表..."),k("清空旧数据...",60);for(const O of K)await Je(O.tableName),console.log(`<i data-lucide="check-circle"></i> 表 ${O.tableName} 已清空`)}k("上传中...",70);for(const O of K)O.records.length>0&&await Ye(O.tableName,O.records);if(k("完成！",100),e==="inventory"){const O=K[0].records.length,V=K[1].records.length;c.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 成功 ${j.length} 条 (普通库存：${O}，福利库存：${V})</span>`}else c.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 成功 ${j.length} 条</span>`;const Q=new Date().toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});localStorage.setItem(`lastUpload_${e}`,Q),b(Q),await Be(e,d.name,j.length,v);const ae=a.title.replace(/<[^>]*>/g,"").trim();($=(h=window.AppUtils)==null?void 0:h.showToast)==null||$.call(h,`${ae} 成功处理并上传 ${j.length} 条`,"success")}catch(q){console.error("上传失败:",q),s.textContent="上传失败",c.innerHTML=`<span class="error"><i data-lucide="x-circle"></i> ${q.message}</span>`,(N=(A=window.AppUtils)==null?void 0:A.showToast)==null||N.call(A,"上传失败: "+q.message,"error")}finally{S()}});function k(v,C){s.textContent=v,l.style.width=C+"%"}}async function da(e){return new Promise((a,t)=>{const n=new FileReader;n.onload=r=>{try{const o=new Uint8Array(r.target.result),i=XLSX.read(o,{type:"array"}),s=i.Sheets[i.SheetNames[0]];a(XLSX.utils.sheet_to_json(s,{header:1,defval:""}))}catch(o){t(new Error("解析失败: "+o.message))}},n.onerror=()=>t(new Error("读取失败")),n.readAsArrayBuffer(e)})}async function Je(e){const{error:a}=await window.supabaseClient.from(e).delete().gte("id",0);if(a)throw console.error("清空表失败:",a),new Error("清空失败: "+a.message);console.log(`<i data-lucide="check-circle"></i> 已清空表 ${e}`)}async function Ye(e,a){for(let n=0;n<a.length;n+=100){const{error:r}=await window.supabaseClient.from(e).insert(a.slice(n,n+100));if(r)throw new Error("上传失败: "+r.message)}}async function ua(e){const a=new Set;let t=0;const n=1e3;let r=!0;for(;r;){const{data:o,error:i}=await window.supabaseClient.from(e).select("product_id").range(t*n,(t+1)*n-1);if(i)throw new Error("查询已有商品ID失败: "+i.message);(o||[]).forEach(s=>{const l=String(s.product_id??"").trim();l&&a.add(l)}),!o||o.length<n?r=!1:t++}return a}async function pa(e,a){const t=await ua(e),n=new Set,r=[];let o=0;return a.forEach(i=>{const s=String(i.product_id??"").trim();if(s&&(t.has(s)||n.has(s))){o++;return}s&&n.add(s),r.push(i)}),{newRecords:r,duplicateCount:o}}window.loadUploadPage=function(e){return e==="upload"||e.startsWith("upload-")?{html:la(),init:()=>{Object.entries(gt).forEach(([a,t])=>{ca(a,t)})}}:null};function ma(e){console.log(`<i data-lucide="package"></i> [新品处理] 开始解析数据, 原始行数: ${(e==null?void 0:e.length)||0}`);const a=[],t=e[0]||[];let n=-1;for(let r=0;r<t.length;r++)if(String(t[r]??"").trim()==="颜色及规格"){n=r,console.log(`📍 [新品处理] 找到"颜色及规格"字段在第 ${r+1} 列（索引 ${r}）`);break}if(n===-1)throw new Error('表格中未找到"颜色及规格"字段，请检查表头是否包含该字段（需完全匹配）');for(let r=1;r<e.length;r++){const o=e[r];if(!o||o.length===0)continue;const i=String(o[1]??"").trim();!i||i==="nan"||a.push({original_name:i,product_name:i,image_url:String(o[0]??"").trim()||null,product_code:String(o[2]??"").trim()||null,virtual_category:String(o[3]??"").trim()||null,category:String(o[4]??"").trim()||null,product_tag:String(o[5]??"").trim()||null,base_price:parseFloat(o[6])||0,warehouse:String(o[7]??"").trim()||null,color_spec:n>=0&&String(o[n]??"").trim()||null})}return console.log(`<i data-lucide="check-circle"></i> [新品处理] 解析完成, 有效记录: ${a.length} 条`),a}async function ga(e){console.log(`✏️ [名称生成] 开始生成商品名称, 商品数: ${e.length}`);const a=await ft(),t=await vt();let n=["name","origin","hot","category"];try{n=JSON.parse(a.formula_order||'["name", "origin", "hot", "category"]')}catch{console.warn("公式顺序解析失败，使用默认顺序")}const r=a.name_prefix||"「",o=a.name_suffix||"」";console.log(`  📝 [名称生成] 公式顺序: ${n.join(" -> ")}, 前缀: ${r}, 后缀: ${o}`);const i=e.map(s=>{let l=[];return n.forEach(c=>{switch(c){case"name":l.push(`${r}${s.original_name}${o}`);break;case"origin":a.origin_word&&l.push(a.origin_word);break;case"hot":a.hot_word&&l.push(a.hot_word);break;case"category":s.category&&t[s.category]&&l.push(t[s.category]);break}}),{...s,product_name:l.join("")}});return console.log('<i data-lucide="check-circle"></i> [名称生成] 完成'),i}async function fa(e){console.log(`🏷️ [上架分类] 开始生成上架分类, 商品数: ${e.length}`);const a=await va(),t=e.map(n=>{const r=n.category&&a[n.category]||null;return{...n,listing_category:r}});return console.log('<i data-lucide="check-circle"></i> [上架分类] 完成'),t}async function ft(){const e={origin_word:"韩国",hot_word:"",name_prefix:"「",name_suffix:"」",formula_order:'["name", "origin", "hot", "category"]'};try{const{data:a,error:t}=await window.supabaseClient.from("name_formula_settings").select("*").limit(1).single();return t||!a?e:{...e,...a}}catch{return e}}async function vt(){try{const{data:e,error:a}=await window.supabaseClient.from("category_words").select("*");if(a||!e)return{};const t={};return e.forEach(n=>{t[n.category]=n.category_word}),t}catch{return{}}}async function va(){try{const{data:e,error:a}=await window.supabaseClient.from("listing_category_mapping").select("*");if(a||!e)return{};const t={};return e.forEach(n=>{t[n.source_category]=n.listing_category}),t}catch{return{}}}async function Ge(e,a){try{const{data:t,error:n}=await window.supabaseClient.from("name_formula_settings").select("id").order("id",{ascending:!0});if(n)throw n;if(t&&t.length>0){const r=t[0].id,{error:o}=await window.supabaseClient.from("name_formula_settings").update({origin_word:e,hot_word:a,updated_at:new Date().toISOString()}).eq("id",r);if(o)throw o;if(t.length>1){const i=t.slice(1).map(s=>s.id);try{await window.supabaseClient.from("name_formula_settings").delete().in("id",i),console.log("已清理重复设置记录:",i)}catch(s){console.warn("清理重复记录失败 (非致命错误):",s)}}}else{const{error:r}=await window.supabaseClient.from("name_formula_settings").insert({origin_word:e,hot_word:a});if(r)throw r}}catch(t){throw console.error("保存设置失败:",t),new Error("保存失败: "+t.message)}}async function ya(e){if(await window.supabaseClient.from("category_words").delete().gte("id",0),e.length>0){const{error:a}=await window.supabaseClient.from("category_words").insert(e);if(a)throw new Error("保存失败: "+a.message)}}async function ba(e){if(await window.supabaseClient.from("listing_category_mapping").delete().gte("id",0),e.length>0){const{error:a}=await window.supabaseClient.from("listing_category_mapping").insert(e);if(a)throw new Error("保存失败: "+a.message)}}async function ha(e,a,t){try{const{error:n}=await window.supabaseClient.from("upload_history").insert({upload_type:"new-product",file_name:e,record_count:a,upload_mode:t});n&&console.error("保存上传历史失败:",n)}catch(n){console.error("保存上传历史异常:",n)}}async function wa(){const e=document.getElementById("uploadHistoryModal");e&&e.remove();const a=document.createElement("div");a.id="uploadHistoryModal",a.className="modal-overlay",a.innerHTML=`
        <div class="modal-content upload-history-modal">
            <div class="modal-header">
                <h3><i data-lucide="history"></i> 新品数据上传 - 最近上传记录</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body" id="uploadHistoryContent">
                <p class="text-muted">加载中...</p>
            </div>
        </div>
    `,document.body.appendChild(a),a.addEventListener("click",n=>{n.target===a&&a.remove()});const t=document.getElementById("uploadHistoryContent");try{const{data:n,error:r}=await window.supabaseClient.from("upload_history").select("*").eq("upload_type","new-product").order("created_at",{ascending:!1}).limit(10);if(r)throw r;if(!n||n.length===0){t.innerHTML='<p class="text-muted">暂无上传记录</p>';return}t.innerHTML=`
            <table class="history-table">
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>上传时间</th>
                        <th>商品数量</th>
                        <th>上传模式</th>
                    </tr>
                </thead>
                <tbody>
                    ${n.map(o=>`
                        <tr>
                            <td class="file-name">${o.file_name}</td>
                            <td>${xa(o.created_at)}</td>
                            <td><span class="record-count">${o.record_count}</span></td>
                            <td>${o.upload_mode==="full"?"更新全部":"补充上传"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `,window.lucide&&window.lucide.createIcons()}catch(n){t.innerHTML=`<p class="text-error">加载失败: ${n.message}</p>`}}function xa(e){return new Date(e).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}function _a(){return`
        <div class="new-product-page">
            <div class="upload-blocks-grid">
                <!-- 上传区块 -->
                <div class="upload-block" id="block-new-product">
                    <div class="upload-block-header">
                        <h3><i data-lucide="package"></i> 新品数据上传 <span class="tag-red">影刀读取</span></h3>
                    </div>
                    
                    <div class="upload-zone" id="uploadZone-new-product">
                        <div class="upload-zone-icon">📁</div>
                        <p>拖拽文件到此处，或点击选择</p>
                        <p class="upload-hint">.xlsx, .xls, .csv</p>
                        <input type="file" id="fileInput-new-product" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div class="upload-options">
                        <label class="radio-label">
                            <input type="radio" name="mode-new-product" value="full" checked>
                            <span>更新全部</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="mode-new-product" value="incremental">
                            <span>补充上传</span>
                        </label>
                    </div>
                    
                    <details class="mapping-details">
                        <summary><i data-lucide="link"></i> 字段映射</summary>
                        <table class="mapping-table">
                            <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                            <tbody>
                                <tr><td>A列 图片</td><td>→</td><td>image_url</td></tr>
                                <tr><td>B列 商品名称</td><td>→</td><td>original_name</td></tr>
                                <tr><td>C列 商品编码</td><td>→</td><td>product_code</td></tr>
                                <tr><td>D列 虚拟分类</td><td>→</td><td>virtual_category</td></tr>
                                <tr><td>E列 分类</td><td>→</td><td>category</td></tr>
                                <tr><td>F列 商品标签</td><td>→</td><td>product_tag</td></tr>
                                <tr><td>G列 基本售价</td><td>→</td><td>base_price</td></tr>
                                <tr><td>H列 主仓位</td><td>→</td><td>warehouse</td></tr>
                                <tr><td>O列 颜色规格</td><td>→</td><td>color_spec</td></tr>
                            </tbody>
                        </table>
                    </details>
                    
                    <div class="upload-status" id="status-new-product" style="display:none">
                        <div class="status-text" id="statusText-new-product">准备中...</div>
                        <div class="progress-bar"><div class="progress-fill" id="progress-new-product"></div></div>
                        <div class="status-detail" id="statusDetail-new-product"></div>
                    </div>
                    
                    <div class="upload-actions">
                        <button class="btn btn-primary btn-upload" id="uploadBtn-new-product" disabled>
                            上传并处理
                        </button>
                        <button class="btn btn-secondary btn-history" id="historyBtn-new-product"><i data-lucide="history"></i> 查看历史</button>
                    </div>
                </div>
                
                <!-- 处理结果区块 -->
                <div class="upload-block upload-block-scrollable" id="block-result">
                    <div class="upload-block-header">
                        <h3>📊 处理说明 & 结果 <span class="db-table-tag">→ new_product_data</span></h3>
                    </div>
                    
                    <div class="scrollable-content">
                    <!-- 处理流程说明 -->
                    <div class="process-info">
                        <div class="process-section">
                            <h4><i data-lucide="clipboard-list"></i> 处理流程</h4>
                            <ol class="process-steps">
                                <li><span class="step-num">1</span> 读取上传的 Excel 文件</li>
                                <li><span class="step-num">2</span> 解析商品数据（名称、编码、分类等）</li>
                                <li><span class="step-num">3</span> 应用名称公式生成新商品名</li>
                                <li><span class="step-num">4</span> 根据分类映射生成上架分类</li>
                                <li><span class="step-num">5</span> 上传数据到数据库</li>
                            </ol>
                        </div>
                        
                        <div class="process-section">
                            <h4>⚙️ 名称生成公式</h4>
                            <div class="formula-box">
                                <code>「原名称」+ 产地词 + 热卖词 + 分类词汇</code>
                            </div>
                            <p class="formula-example">示例：「明星马尾」韩国25新年百搭香蕉夹</p>
                        </div>
                        
                        <div class="process-section">
                            <h4>💡 设置提示</h4>
                            <ul class="tips-list">
                                <li>在 <strong>⚙️ 设置</strong> 页可配置产地词、热卖词</li>
                                <li>可设置分类映射（分类→词汇 & 上架分类）</li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- 处理结果 -->
                    <div class="result-divider"></div>
                    <h4 class="result-title">📈 处理结果</h4>
                    <div id="result-content" class="result-content">
                        <p class="text-muted">上传数据后显示处理结果</p>
                    </div>
                    </div><!-- end scrollable-content -->

                </div>
            </div>
            
            <!-- 数据库数据表格 -->
            <div class="data-table-section">
                <div class="data-table-header">
                    <h3><i data-lucide="clipboard-list"></i> 数据库新品列表 <span class="db-table-tag">← new_product_data</span> <span id="lastRefreshTime" class="refresh-time"></span> <span id="recordCountInfo" class="record-count"></span></h3>
                    <div class="header-buttons">
                        <button class="btn btn-success btn-sm" id="downloadRenameBtn" style="display:none; height: 32px; padding: 0 12px;">下载重命名表</button>
                        <button class="btn btn-primary btn-sm" id="downloadListingBtn" style="display:none; height: 32px; padding: 0 12px;">上链接表格下载</button>
                        <button class="btn btn-primary btn-sm" id="saveListingDataBtn" style="display:none; height: 32px; padding: 0 12px;">同步上链接表</button><span class="db-table-tag">→ listing_data_export</span>
                        <button class="btn btn-sm" id="productCheckerBtn" onclick="openProductCheckerModal()" style="background:var(--error-color); color:white; border:none; height: 32px; padding: 0 12px;">商品检查</button>
                        <button class="btn btn-primary btn-sm" id="refreshDataBtn" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0; min-width: auto; flex-shrink: 0;"><i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </div>
                <div id="dataTableContainer" class="data-table-container">
                    <p class="text-muted">点击刷新加载数据</p>
                </div>
            </div>
            </div>
        </div>
    `}function ka(){return Ea()}function Sa(){ht()}function Ea(){return`
        <div class="rules-settings-panel" style="background:var(--bg-secondary); padding:1.5rem 2rem; border-radius:var(--border-radius);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                <div style="text-align: left;">
                    <h3 style="margin:0;">🔢 序号分配规则 <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal; margin-left: 8px;">(按商品编码从小到大排序后依次分配序号，同名商品共享序号)</span> <span class="db-table-tag">→ ranking_config (new_product_number_rules)</span></h3>
                </div>
                <button class="btn btn-primary" id="btnSaveRules" style="margin-top:2px;"><i data-lucide="save"></i> 保存配置</button>
            </div>

            <div id="rulesListContainer" style="display:flex; flex-direction:column; gap:1rem;">
                <!-- Rules injected via JS -->
            </div>

            <button class="btn btn-secondary" id="btnAddRule" style="margin-top:1.5rem; width:100%; border-style:dashed;">+ 添加分配规则</button>

            <div style="margin-top:1.5rem; padding:1rem 1.25rem; background:rgba(234, 179, 8, 0.1); border:1px solid rgba(234, 179, 8, 0.3); border-radius:var(--border-radius-sm);">
                <div style="display:flex; align-items:flex-start; gap:0.75rem;">
                    <span style="font-size:1.25rem; flex-shrink:0; margin-top:2px;"><i data-lucide="gift"></i></span>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:0.9rem; font-weight:600; color:var(--text-primary);">福利商品序号设置</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">商品标签（product_tag）包含"福利"二字的商品可单独指定序号。留空则不分配序号，也不占用序号位。</div>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.75rem;">
                            <label style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap;">福利商品序号：</label>
                            <input type="text" id="welfareNumberInput" placeholder="留空 = 跳过不分配（可输入中文）" class="input input-sm" style="flex:1; max-width:260px;">
                            <button class="btn btn-sm btn-secondary" id="btnSaveWelfareNumber"><i data-lucide="save"></i> 保存</button>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.35rem;">数据库表: ranking_config (config_key='new_product_welfare_number')</div>
                    </div>
                </div>
            </div>

            <div class="rules-preview" style="margin-top:2rem; padding:1.5rem; background:var(--bg-tertiary); border-radius:var(--border-radius-sm);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h4 style="margin:0; font-size:0.9rem;">👁️ 规则预览</h4>
                    <button class="btn btn-sm btn-secondary" id="btnPreviewRules">刷新预览</button>
                </div>
                <div id="rulesPreviewText" style="font-family:monospace; color:var(--text-secondary); font-size:0.85rem; line-height:1.6; white-space: pre-wrap;">请配置规则...</div>
            </div>
        </div>
    `}function $a(){return`
        <div class="settings-page">
            <!-- 第1列：名称公式设置 -->
            <div class="settings-section">
                <div class="settings-header">
                    <h3>📝 名称公式设置</h3>
                </div>
                
                <!-- 符号设置 -->
                <div class="settings-subsection">
                    <h4>🔤 符号设置</h4>
                    <div class="symbol-settings">
                        <div class="settings-group">
                            <label>前缀符号</label>
                            <div class="inline-edit-field">
                                <input type="text" id="namePrefix" placeholder="「" class="settings-input symbol-input" maxlength="5">
                                <button class="btn-icon save-inline" id="saveNamePrefix" title="保存">✓</button>
                            </div>
                        </div>
                        <div class="settings-group">
                            <label>后缀符号</label>
                            <div class="inline-edit-field">
                                <input type="text" id="nameSuffix" placeholder="」" class="settings-input symbol-input" maxlength="5">
                                <button class="btn-icon save-inline" id="saveNameSuffix" title="保存">✓</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 公式顺序设置 -->
                <div class="settings-subsection">
                    <h4>📐 公式顺序</h4>
                    <p class="settings-hint-sm">拖拽调整各元素在生成名称中的顺序</p>
                    <ul class="formula-order-list" id="formulaOrderList">
                        <li data-key="name" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">原名称（含符号）</span>
                        </li>
                        <li data-key="origin" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">产地词</span>
                        </li>
                        <li data-key="hot" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">热卖词</span>
                        </li>
                        <li data-key="category" class="formula-item">
                            <span class="drag-handle">☰</span>
                            <span class="formula-label">分类词汇</span>
                        </li>
                    </ul>
                    <button class="btn btn-primary btn-sm" id="saveFormulaOrder" style="width:100%;margin-top:0.5rem"><i data-lucide="save"></i> 保存公式顺序</button>
                </div>
                
                <!-- 词汇设置 -->
                <div class="settings-subsection">
                    <h4>✏️ 词汇设置</h4>
                    <div class="settings-group">
                        <label>产地词</label>
                        <div class="inline-edit-field">
                            <input type="text" id="originWord" placeholder="如：韩国" class="settings-input">
                            <button class="btn-icon save-inline" id="saveOriginWord" title="保存">✓</button>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <label>热卖词</label>
                        <div class="inline-edit-field">
                            <input type="text" id="hotWord" placeholder="如：26新年百搭" class="settings-input">
                            <button class="btn-icon save-inline" id="saveHotWord" title="保存">✓</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 第2列：分类映射设置（合并词汇映射和上架分类映射） -->
            <div class="settings-section">
                <div class="settings-header">
                    <h3>🏷️ 分类映射设置</h3>
                    <div class="header-buttons">
                        <button class="btn btn-primary btn-sm save-mapping-btn" id="saveCombinedMappingBtn" style="display:none"><i data-lucide="save"></i> 保存</button>
                        <button class="btn btn-secondary btn-sm" id="addCombinedMapping">+ 添加</button>
                    </div>
                </div>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0 0 0.75rem;">基于上传表格的分类，同时设置词汇映射和上架分类映射</p>
                <div id="combinedMappingTable" class="mapping-table-container">
                    <!-- 表格由 JS 渲染 -->
                </div>
            </div>
        </div>
    `}function Ca(){const e=document.getElementById("uploadZone-new-product"),a=document.getElementById("fileInput-new-product"),t=document.getElementById("uploadBtn-new-product"),n=document.getElementById("historyBtn-new-product"),r=document.getElementById("status-new-product"),o=document.getElementById("statusText-new-product"),i=document.getElementById("progress-new-product"),s=document.getElementById("statusDetail-new-product"),l=document.getElementById("result-content");let c=null;ht(),n==null||n.addEventListener("click",wa),e.addEventListener("click",()=>a.click()),e.addEventListener("dragover",B=>{B.preventDefault(),e.classList.add("dragover")}),e.addEventListener("dragleave",()=>e.classList.remove("dragover")),e.addEventListener("drop",B=>{B.preventDefault(),e.classList.remove("dragover"),B.dataTransfer.files.length>0&&u(B.dataTransfer.files[0])}),a.addEventListener("change",B=>{B.target.files.length>0&&u(B.target.files[0])});function u(B){c=B,e.innerHTML=`<div class="upload-zone-icon"><i data-lucide="check-circle"></i></div><p><strong>${B.name}</strong></p>`,t.disabled=!1}t.addEventListener("click",async()=>{var k,v,C,I;if(!c)return;const B=document.querySelector('input[name="mode-new-product"]:checked').value==="full";try{r.style.display="block",t.disabled=!0,p("读取文件...",10);const D=await Ta(c);p("解析数据...",20);let M=ma(D);if(p(`解析 ${M.length} 条数据`,30),M.length===0)throw new Error("无有效数据");p("生成商品名称...",40),M=await ga(M),p("生成上架分类...",50),p("生成上架分类...",50),M=await fa(M),p("分配序号...",55);try{const[$,A]=await Promise.all([yt(),bt()]);console.log("加载到的规则:",$,"福利序号:",A),M=Ma(M,$,A),console.log("分配后的第一条记录:",M[0])}catch($){console.warn("序号分配失败",$)}B&&(p("清空旧数据...",60),await window.supabaseClient.from("new_product_data").delete().gte("id",0)),p("上传数据...",65);const P=100;for(let $=0;$<M.length;$+=P){const A=M.slice($,$+P),{error:N}=await window.supabaseClient.from("new_product_data").insert(A);if(N)throw new Error("新品上传失败: "+N.message)}p("完成！",100),s.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 成功处理 ${M.length} 条商品</span>`,l.innerHTML=`
                <div class="result-summary">
                    <p><i data-lucide="check-circle"></i> 处理完成</p>
                    <p>商品总量：${M.length}</p>
                    <p>已应用名称公式</p>
                    <p>已生成上架分类</p>
                </div>
            `,document.getElementById("downloadRenameBtn").style.display="inline-block",document.getElementById("saveListingDataBtn").style.display="inline-block";const h=B?"full":"incremental";await ha(c.name,M.length,h),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,`成功处理 ${M.length} 条商品`,"success"),d()}catch(D){console.error("处理失败:",D),o.textContent="处理失败",s.innerHTML=`<span class="error"><i data-lucide="x-circle"></i> ${D.message}</span>`,(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"处理失败: "+D.message,"error")}finally{t.disabled=!1}});function p(B,k){o.textContent=B,i.style.width=k+"%"}document.getElementById("refreshDataBtn").addEventListener("click",d);const m=document.getElementById("downloadRenameBtn"),f=document.getElementById("downloadListingBtn"),L=document.getElementById("saveListingDataBtn");m.addEventListener("click",()=>_("rename")),f.addEventListener("click",()=>_("listing")),L.addEventListener("click",S);async function d(){const B=document.getElementById("dataTableContainer"),k=document.getElementById("lastRefreshTime");B.innerHTML='<p class="text-muted">加载中...</p>';try{const{data:v,error:C}=await window.supabaseClient.from("new_product_data").select("*").order("product_code",{ascending:!0}).limit(100);if(C)throw C;const I=new Date;k.textContent=`(${I.getHours().toString().padStart(2,"0")}:${I.getMinutes().toString().padStart(2,"0")}:${I.getSeconds().toString().padStart(2,"0")} 刷新)`;const D=document.getElementById("recordCountInfo"),M=new Set(v.map(P=>P.original_name||"")).size;if(D&&(D.textContent=`商品 ${M} 个，基础资料 ${v.length} 条`),!v||v.length===0){B.innerHTML='<p class="text-muted">暂无数据</p>';return}B.innerHTML=`
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>图片</th>
                                <th>原名称</th>
                                <th>生成名称</th>
                                <th>分类</th>
                                <th>上架分类</th>
                                <th>编码</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${v.map(P=>`
                                <tr>
                                    <td style="font-weight:bold; color:var(--primary-color);">${P.sample_number||"-"}</td>
                                    <td>
                                        <div class="thumb-wrapper">
                                            ${P.image_url?`<img src="${P.image_url}" class="product-thumb" loading="lazy" referrerpolicy="no-referrer" alt="商品图片">`:'<span class="no-thumb">无图</span>'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
                                            <span title="${P.original_name||""}">${y(P.original_name,20)}</span>
                                            ${b(P.virtual_category)}
                                        </div>
                                    </td>
                                    <td title="${P.product_name||""}">${y(P.product_name,30)}</td>
                                    <td>${P.category||"-"}</td>
                                    <td>${P.listing_category||"-"}</td>
                                    <td>${P.product_code||"-"}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `,document.getElementById("downloadRenameBtn").style.display="inline-block",document.getElementById("saveListingDataBtn").style.display="inline-block"}catch(v){B.innerHTML=`<p class="error">加载失败: ${v.message}</p>`}}function y(B,k){return B?B.length>k?B.substring(0,k)+"...":B:"-"}function b(B){return B?B==="可预售"?'<span style="display: inline-block; margin-top: 4px; padding: 2px 6px; background-color: rgba(34, 197, 94, 0.1); color: rgb(21, 128, 61); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 4px; font-size: 11px; line-height: 1;">可预售</span>':B==="不可以收"?'<span style="display: inline-block; margin-top: 4px; padding: 2px 6px; background-color: rgba(239, 68, 68, 0.1); color: rgb(185, 28, 28); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px; font-size: 11px; line-height: 1;">不可以收</span>':`<span style="display: inline-block; margin-top: 4px; padding: 2px 6px; background-color: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 4px; font-size: 11px; line-height: 1;">${B}</span>`:""}async function _(B){var k,v,C,I,D,M;try{const{data:P,error:h}=await window.supabaseClient.from("new_product_data").select("*");if(h)throw h;if(!P||P.length===0){(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"暂无数据可下载","warning");return}let $,A;if(B==="rename"){$=[["商品编码","商品名称","商品简称"]],P.forEach(J=>{$.push([J.product_code||"",J.product_name||"",J.original_name||""])});const j=new Date;A=`重命名表格_${`${j.getFullYear()}${(j.getMonth()+1).toString().padStart(2,"0")}${j.getDate().toString().padStart(2,"0")}_${j.getHours().toString().padStart(2,"0")}${j.getMinutes().toString().padStart(2,"0")}${j.getSeconds().toString().padStart(2,"0")}`}.xlsx`}else{P.sort((O,V)=>(O.product_code||"").localeCompare(V.product_code||""));const j=new Map;P.forEach(O=>{const V=O.product_name||"";j.has(V)||j.set(V,[]),j.get(V).push(O)});let K=1;j.forEach(O=>{O.length>K&&(K=O.length)});const J=["商品名称","商品编码","上架分类","虚拟分类","基本售价","颜色及规格","SKU数量"];for(let O=2;O<=K;O++)J.push(`商品编码${O}`,`颜色及规格${O}`);$=[J],j.forEach((O,V)=>{const x=O[0],w=[V,x.product_code||"",x.listing_category||"",x.virtual_category||"",x.base_price||0,x.color_spec||"",O.length];for(let E=1;E<K;E++)E<O.length?w.push(O[E].product_code||"",O[E].color_spec||""):w.push("","");$.push(w)});const Q=new Date;A=`上链接表_${`${Q.getFullYear()}${(Q.getMonth()+1).toString().padStart(2,"0")}${Q.getDate().toString().padStart(2,"0")}_${Q.getHours().toString().padStart(2,"0")}${Q.getMinutes().toString().padStart(2,"0")}${Q.getSeconds().toString().padStart(2,"0")}`}.xlsx`}const N=XLSX.utils.aoa_to_sheet($),q=XLSX.utils.book_new();XLSX.utils.book_append_sheet(q,N,"Sheet1"),XLSX.writeFile(q,A),(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"下载成功","success")}catch(P){(M=(D=window.AppUtils)==null?void 0:D.showToast)==null||M.call(D,"下载失败: "+P.message,"error")}}async function S(){var B,k,v,C,I,D;try{L.disabled=!0,L.textContent="保存中...";const{data:M,error:P}=await window.supabaseClient.from("new_product_data").select("*");if(P)throw P;if(!M||M.length===0){(k=(B=window.AppUtils)==null?void 0:B.showToast)==null||k.call(B,"暂无数据可保存","warning");return}M.sort((q,j)=>(q.product_code||"").localeCompare(j.product_code||""));const h=new Map;M.forEach(q=>{const j=q.product_name||"";h.has(j)||h.set(j,[]),h.get(j).push(q)});const $=[];h.forEach((q,j)=>{const K=q[0],J={product_name:j,product_code:K.product_code||"",listing_category:K.listing_category||"",virtual_category:K.virtual_category||"",base_price:K.base_price||0,color_spec:K.color_spec||"",sku_count:q.length};for(let Q=1;Q<Math.min(q.length,10);Q++)J[`product_code_${Q+1}`]=q[Q].product_code||"",J[`color_spec_${Q+1}`]=q[Q].color_spec||"";$.push(J)}),console.log("准备保存上链接数据到 listing_data_export，共",$.length,"条");const{error:A}=await window.supabaseClient.from("listing_data_export").delete().gte("id",0);if(A)throw new Error("清空旧数据失败: "+A.message);const N=100;for(let q=0;q<$.length;q+=N){const j=$.slice(q,q+N),{error:K}=await window.supabaseClient.from("listing_data_export").insert(j);if(K)throw new Error("保存失败: "+K.message)}console.log("上链接数据保存成功，共",$.length,"条"),(C=(v=window.AppUtils)==null?void 0:v.showToast)==null||C.call(v,`保存成功！共 ${$.length} 条数据`,"success")}catch(M){console.error("保存上链接数据失败:",M),(D=(I=window.AppUtils)==null?void 0:I.showToast)==null||D.call(I,"保存失败: "+M.message,"error")}finally{L.disabled=!1,L.textContent="同步上链接表"}}d()}async function Ia(){const e=document.getElementById("originWord"),a=document.getElementById("hotWord"),t=document.getElementById("namePrefix"),n=document.getElementById("nameSuffix"),r=document.getElementById("formulaOrderList"),o=document.getElementById("combinedMappingTable"),i=document.getElementById("addCombinedMapping"),s=document.getElementById("saveCombinedMappingBtn"),l=document.getElementById("saveOriginWord"),c=document.getElementById("saveHotWord"),u=document.getElementById("saveNamePrefix"),p=document.getElementById("saveNameSuffix"),g=document.getElementById("saveFormulaOrder");let m=[],f=["name","origin","hot","category"];await L();async function L(){const k=await ft();e.value=k.origin_word||"",a.value=k.hot_word||"",t.value=k.name_prefix||"「",n.value=k.name_suffix||"」";try{f=JSON.parse(k.formula_order||'["name", "origin", "hot", "category"]')}catch{f=["name","origin","hot","category"]}d();const v=await vt(),{data:C}=await window.supabaseClient.from("listing_category_mapping").select("*"),I={};(C||[]).forEach(M=>{I[M.source_category]=M.listing_category});const D=new Set([...Object.keys(v),...Object.keys(I)]);m=Array.from(D).map((M,P)=>({id:P,category:M,category_word:v[M]||"",listing_category:I[M]||""})),S()}function d(){const k={name:"原名称（含符号）",origin:"产地词",hot:"热卖词",category:"分类词汇"};r.innerHTML=f.map(v=>`
            <li data-key="${v}" class="formula-item">
                <span class="drag-handle">☰</span>
                <span class="formula-label">${k[v]||v}</span>
            </li>
        `).join(""),y()}function y(){const k=r.querySelectorAll(".formula-item");let v=null;k.forEach(C=>{C.setAttribute("draggable","true"),C.addEventListener("dragstart",I=>{v=C,setTimeout(()=>C.classList.add("dragging"),0)}),C.addEventListener("dragend",()=>{C.classList.remove("dragging"),v=null,f=Array.from(r.querySelectorAll(".formula-item")).map(I=>I.dataset.key)}),C.addEventListener("dragover",I=>{I.preventDefault();const D=b(r,I.clientY);D==null?r.appendChild(v):r.insertBefore(v,D)})})}function b(k,v){return[...k.querySelectorAll(".formula-item:not(.dragging)")].reduce((I,D)=>{const M=D.getBoundingClientRect(),P=v-M.top-M.height/2;return P<0&&P>I.offset?{offset:P,element:D}:I},{offset:Number.NEGATIVE_INFINITY}).element}u==null||u.addEventListener("click",async()=>{var k,v,C,I;try{await _("name_prefix",t.value||"「"),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"前缀符号已保存","success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}}),p==null||p.addEventListener("click",async()=>{var k,v,C,I;try{await _("name_suffix",n.value||"」"),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"后缀符号已保存","success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}}),g==null||g.addEventListener("click",async()=>{var k,v,C,I;try{await _("formula_order",JSON.stringify(f)),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"公式顺序已保存","success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}});async function _(k,v){const{data:C}=await window.supabaseClient.from("name_formula_settings").select("id").order("id",{ascending:!0});if(C&&C.length>0){const{error:I}=await window.supabaseClient.from("name_formula_settings").update({[k]:v,updated_at:new Date().toISOString()}).eq("id",C[0].id);if(I)throw I}else{const{error:I}=await window.supabaseClient.from("name_formula_settings").insert({[k]:v});if(I)throw I}}function S(){if(m.length===0){o.innerHTML='<p class="empty-state">暂无映射，点击上方"添加"按钮添加</p>',s&&(s.style.display="none");return}o.innerHTML=`
            <table class="editable-table">
                <thead><tr><th>分类</th><th>词汇</th><th>上架分类</th><th>操作</th></tr></thead>
                <tbody>
                    ${m.map((k,v)=>`
                        <tr data-idx="${v}">
                            <td><input type="text" class="table-input" value="${k.category||""}" data-field="category"></td>
                            <td><input type="text" class="table-input" value="${k.category_word||""}" data-field="category_word"></td>
                            <td><input type="text" class="table-input" value="${k.listing_category||""}" data-field="listing_category"></td>
                            <td class="actions-cell">
                                <button class="btn-icon btn-delete" data-idx="${v}" title="删除">🗑️</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `,o.querySelectorAll(".btn-delete").forEach(k=>{k.addEventListener("click",()=>{const v=parseInt(k.dataset.idx);m.splice(v,1),s&&(s.style.display="inline-flex"),S()})}),o.querySelectorAll(".table-input").forEach(k=>{k.addEventListener("input",()=>{s&&(s.style.display="inline-flex")})})}async function B(){var k,v,C,I;try{const D=o.querySelectorAll("tbody tr"),M=[],P=[];D.forEach(h=>{const $=h.querySelector('[data-field="category"]').value.trim(),A=h.querySelector('[data-field="category_word"]').value.trim(),N=h.querySelector('[data-field="listing_category"]').value.trim();$&&(M.push({category:$,category_word:A}),P.push({source_category:$,listing_category:N}))}),await Promise.all([ya(M),ba(P)]),m=M.map((h,$)=>({id:$,category:h.category,category_word:h.category_word,listing_category:P[$].listing_category})),s&&(s.style.display="none"),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"分类映射已保存","success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}}i==null||i.addEventListener("click",()=>{m.push({id:Date.now(),category:"",category_word:"",listing_category:""}),S();const k=o.querySelector("tbody tr:last-child input");k==null||k.focus()}),l==null||l.addEventListener("click",async()=>{var k,v,C,I;try{await Ge(e.value,a.value),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"产地词已保存","success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}}),c==null||c.addEventListener("click",async()=>{var k,v,C,I;try{await Ge(e.value,a.value),(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,"热卖词已保存","success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}}),s==null||s.addEventListener("click",B)}async function Ta(e){return new Promise((a,t)=>{const n=new FileReader;n.onload=r=>{try{const o=new Uint8Array(r.target.result),i=XLSX.read(o,{type:"array"}),s=i.Sheets[i.SheetNames[0]];a(XLSX.utils.sheet_to_json(s,{header:1,defval:""}))}catch(o){t(new Error("解析失败: "+o.message))}},n.onerror=()=>t(new Error("读取失败")),n.readAsArrayBuffer(e)})}async function yt(){const e=[{range_start:1,range_end:20,prefix:"A",start_num:1,step:2},{range_start:21,range_end:99999,prefix:"A",start_num:41,step:1}];try{const{data:a,error:t}=await window.supabaseClient.from("ranking_config").select("config_value").eq("config_key","new_product_number_rules").single();return t||!a||!a.config_value||a.config_value.length===0?e:a.config_value}catch(a){return console.warn("加载序号规则失败，使用默认规则",a),e}}async function bt(){try{const{data:e,error:a}=await window.supabaseClient.from("ranking_config").select("config_value").eq("config_key","new_product_welfare_number").single();if(a||!e)return"";const t=e.config_value;return typeof t=="string"?t:(t==null?void 0:t.text)??""}catch{return""}}async function La(e){const{error:a}=await window.supabaseClient.from("ranking_config").upsert({config_key:"new_product_welfare_number",config_value:e,updated_at:new Date().toISOString()},{onConflict:"config_key"});if(a)throw a}async function Ba(e){const{error:a}=await window.supabaseClient.from("ranking_config").upsert({config_key:"new_product_number_rules",config_value:e,updated_at:new Date().toISOString()},{onConflict:"config_key"});if(a)throw a}function Ma(e,a,t){if(!a||a.length===0)return e;const n=[...a].sort((l,c)=>l.range_start-c.range_start),r=typeof t=="string"?t.trim():"",o=[...e].sort((l,c)=>{const u=l.product_code||"",p=c.product_code||"";return u.localeCompare(p,"zh-CN",{numeric:!0})}),i=new Map;let s=1;return o.forEach(l=>{const c=l.product_name;if((l.product_tag||"").includes("福利")){l.sample_number=r,i.set(c,r);return}if(i.has(c))l.sample_number=i.get(c);else{let p=n.find(m=>s>=m.range_start&&s<=m.range_end),g="";if(p){const m=s-p.range_start,f=parseInt(p.start_num)+m*parseInt(p.step);g=(p.prefix||"")+String(f).padStart(2,"0")}i.set(c,g),l.sample_number=g,s++}}),e}function ht(){const e=document.getElementById("rulesListContainer"),a=document.getElementById("btnAddRule"),t=document.getElementById("btnSaveRules"),n=document.getElementById("btnPreviewRules"),r=document.getElementById("rulesPreviewText"),o=document.getElementById("welfareNumberInput"),i=document.getElementById("btnSaveWelfareNumber");let s=[];Promise.all([yt(),bt()]).then(([c,u])=>{s=c&&c.length?c:[{range_start:1,range_end:20,prefix:"A",start_num:1,step:2},{range_start:21,range_end:99999,prefix:"A",start_num:41,step:1}],o&&(o.value=u||""),l()}),i==null||i.addEventListener("click",async()=>{var c,u,p,g;try{i.disabled=!0,i.textContent="保存中...",await La(o?o.value:""),(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"福利商品序号已保存","success")}catch(m){(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,"保存失败: "+m.message,"error")}finally{i.disabled=!1,i.innerHTML='<i data-lucide="save"></i> 保存'}});function l(){e&&(e.innerHTML=s.map((c,u)=>`
            <div class="rule-item" data-index="${u}" style="background:var(--bg-tertiary); padding:1rem; border-radius:4px; display:flex; gap:1rem; align-items:flex-end; border:1px solid var(--border-color);">
                <div style="flex:1">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">第几个品（按编码排序后）</label>
                    <div style="display:flex; align-items:center; gap:0.5rem">
                        <input type="number" class="input input-sm rule-start" value="${c.range_start}" style="width:70px">
                        <span>-</span>
                        <input type="number" class="input input-sm rule-end" value="${c.range_end}" style="width:70px">
                    </div>
                </div>
                 <div style="width:80px">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">前缀</label>
                    <input type="text" class="input input-sm rule-prefix" value="${c.prefix||""}" style="width:100%">
                </div>
                <div style="width:80px">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">起始号</label>
                    <input type="number" class="input input-sm rule-start-num" value="${c.start_num}" style="width:100%">
                </div>
                <div style="width:80px">
                    <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">步长</label>
                    <input type="number" class="input input-sm rule-step" value="${c.step}" style="width:100%">
                </div>
                <button class="btn btn-sm btn-icon btn-delete-rule" style="color:var(--error-color); height:32px; width:32px; display:flex; align-items:center; justify-content:center; cursor: pointer;">✕</button>
            </div>
        `).join(""),e.querySelectorAll(".btn-delete-rule").forEach(c=>{c.addEventListener("click",u=>{const p=parseInt(u.target.closest(".rule-item").dataset.index);s.splice(p,1),l()})}),e.querySelectorAll("input").forEach(c=>{c.addEventListener("change",u=>{const p=u.target.closest(".rule-item"),g=parseInt(p.dataset.index),m=s[g];u.target.classList.contains("rule-start")&&(m.range_start=parseInt(u.target.value)||0),u.target.classList.contains("rule-end")&&(m.range_end=parseInt(u.target.value)||0),u.target.classList.contains("rule-prefix")&&(m.prefix=u.target.value),u.target.classList.contains("rule-start-num")&&(m.start_num=parseInt(u.target.value)||0),u.target.classList.contains("rule-step")&&(m.step=parseInt(u.target.value)||1)})}))}a==null||a.addEventListener("click",()=>{const c=s[s.length-1],u=c?c.range_end+1:1;s.push({range_start:u,range_end:u+99,prefix:"A",start_num:u,step:1}),l()}),t==null||t.addEventListener("click",async()=>{var c,u,p,g;try{t.disabled=!0,t.textContent="保存中...",await Ba(s),(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"保存成功，需要重新上传新品才可在排品中应用新的序号分配规则","success")}catch(m){(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,"保存失败: "+m.message,"error")}finally{t.disabled=!1,t.innerHTML='<i data-lucide="save"></i> 保存配置'}}),n==null||n.addEventListener("click",()=>{let c=[];const u=[...s].sort((p,g)=>p.range_start-g.range_start);for(let p=1;p<=100;p++){let g="",m=u.find(f=>p>=f.range_start&&p<=f.range_end);if(m){let f=p-m.range_start,L=parseInt(m.start_num)+f*parseInt(m.step);g=(m.prefix||"")+String(L).padStart(2,"0")}else g="N/A";c.push(`第 ${p} 个 -> ${g}`)}r.textContent=c.join(`
`)})}function Aa(){return`
        <div class="new-product-links-page">
            <div class="data-table-section" style="margin-top: 0;">
                <div class="data-table-header">
                    <h3><i data-lucide="link-2"></i> 新品链接 <span class="db-table-tag">← new_product_links</span> <span id="linksLastUpdate" class="refresh-time"></span> <span id="linksCountInfo" class="record-count"></span></h3>
                    <div class="header-buttons">
                        <button class="btn btn-primary btn-sm" id="refreshLinksBtn" style="width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0; min-width: auto; flex-shrink: 0;"><i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </div>
                <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0 0 1rem;">[每次商品检查并上传表格后自动全量更新] 商品链接格式：https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=商品ID&origin_type=604</p>
                <div id="linksTableContainer" class="data-table-container">
                    <p class="text-muted">点击刷新加载数据</p>
                </div>
            </div>
        </div>
    `}function Da(){const e=document.getElementById("refreshLinksBtn"),a=document.getElementById("linksTableContainer"),t=document.getElementById("linksLastUpdate"),n=document.getElementById("linksCountInfo");window._refreshNewProductLinks=r,e==null||e.addEventListener("click",r);async function r(){var o;a.innerHTML='<p class="text-muted">加载中...</p>';try{const{data:i,error:s}=await window.supabaseClient.from("new_product_links").select("product_id, product_link, created_at").order("id",{ascending:!0});if(s)throw s;if(!i||i.length===0){a.innerHTML='<p class="text-muted">暂无数据，请先执行「商品检查」并上传表格</p>',t&&(t.textContent=""),n&&(n.textContent="");return}const l=new Date;t&&(t.textContent=`(刷新于 ${l.getHours().toString().padStart(2,"0")}:${l.getMinutes().toString().padStart(2,"0")}:${l.getSeconds().toString().padStart(2,"0")})`),n&&(n.textContent=`共 ${i.length} 个商品`);const c=(o=i[0])==null?void 0:o.created_at,u=c?new Date(c).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"-",p=30,g=[];for(let f=0;f<i.length;f+=p)g.push(i.slice(f,f+p));let m=`
                <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; padding:0.75rem 1rem; background:var(--bg-secondary); border-radius:var(--border-radius-sm);">
                    <span style="font-size:0.85rem; color:var(--text-muted);"><i data-lucide="clock" style="width:13px;height:13px;"></i> 最后更新：${u}</span>
                    <span style="font-size:0.85rem; color:var(--text-muted);">|</span>
                    <span style="font-size:0.85rem; color:var(--text-muted);"><i data-lucide="package" style="width:13px;height:13px;"></i> 共 ${i.length} 个商品ID</span>
                    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-left:auto;">
                        ${g.map((f,L)=>{const d=L*p+1,y=d+f.length-1;return`<button class="btn btn-primary copy-group-btn" data-group-idx="${L}" style="font-size:0.9rem; padding: 0.5rem 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <i data-lucide="copy" style="width:14px;height:14px;margin-right:4px;"></i> 复制第 ${d}-${y} 条
                            </button>`}).join("")}
                    </div>
                </div>
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width:50px;">序号</th>
                                <th>商品ID</th>
                                <th>商品链接</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${i.map((f,L)=>`
                                <tr>
                                    <td style="color:var(--text-muted);font-size:0.85rem;">${L+1}</td>
                                    <td style="font-family:monospace;font-size:0.85rem;">${f.product_id}</td>
                                    <td style="font-size:0.8rem;">
                                        <a href="${f.product_link}" target="_blank" class="checker-link" style="word-break:break-all;">${f.product_link}</a>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;a.innerHTML=m,window.lucide&&window.lucide.createIcons(),a.querySelectorAll(".copy-group-btn").forEach(f=>{f.addEventListener("click",async()=>{var b,_;const L=parseInt(f.dataset.groupIdx),y=g[L].map(S=>S.product_link).join(`
`);try{await navigator.clipboard.writeText(y);const S=f.innerHTML;f.innerHTML='<i data-lucide="check" style="width:12px;height:12px;"></i> 已复制',f.style.background="var(--success-color)",f.style.color="white",window.lucide&&window.lucide.createIcons(),setTimeout(()=>{f.innerHTML=S,f.style.background="",f.style.color="",window.lucide&&window.lucide.createIcons()},2e3)}catch{(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"复制失败，请手动复制","error")}})})}catch(i){a.innerHTML=`<p class="error">加载失败: ${i.message}</p>`}}r()}window.loadNewProductPage=function(e){return e==="new-product"?{html:_a(),init:Ca}:e==="new-product-settings"?{html:$a(),init:Ia}:e==="new-product-rules"?{html:ka(),init:Sa}:e==="new-product-links"?{html:Aa(),init:Da}:null};const wt={async deriveKey(e,a){const t=new TextEncoder,n=await crypto.subtle.importKey("raw",t.encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:a,iterations:1e5,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])},async encrypt(e,a){const t=new TextEncoder,n=crypto.getRandomValues(new Uint8Array(16)),r=crypto.getRandomValues(new Uint8Array(12)),o=await this.deriveKey(a,n),i=await crypto.subtle.encrypt({name:"AES-GCM",iv:r},o,t.encode(JSON.stringify(e)));return{salt:btoa(String.fromCharCode(...n)),iv:btoa(String.fromCharCode(...r)),ciphertext:btoa(String.fromCharCode(...new Uint8Array(i)))}},async decrypt(e,a){const t=Uint8Array.from(atob(e.salt),s=>s.charCodeAt(0)),n=Uint8Array.from(atob(e.iv),s=>s.charCodeAt(0)),r=Uint8Array.from(atob(e.ciphertext),s=>s.charCodeAt(0)),o=await this.deriveKey(a,t),i=await crypto.subtle.decrypt({name:"AES-GCM",iv:n},o,r);return JSON.parse(new TextDecoder().decode(i))}};function Oe(){return{当前公式:"默认公式",公式列表:{默认公式:{数据平滑:{讲解次数:.5,成交金额:.5},表现得分权重:{转化能力:{权重:.6,点击成交率分值:.5,成交金额分值:.5},讲解效率:{权重:.4,讲解效率分值:.6,曝光点击率分值:.4}},潜力得分权重:{点击成交率分值:.42,讲解效率分值:.42,潜力因子:.16},总分权重:{表现得分:.8,潜力得分:.2}}}}}async function fe(e){const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");const{data:t,error:n}=await a.from("ranking_config").select("config_value").eq("config_key","scoring_formulas").single();if(n||!t)return console.warn('<i data-lucide="alert-triangle"></i> 未找到评分公式配置，使用默认'),Oe();const r=t.config_value;if(!r.encrypted)return r;if(!e)throw new Error("NEED_PASSWORD");try{return await wt.decrypt(r,e)}catch{throw new Error("PASSWORD_WRONG")}}async function Me(e,a){const t=window.supabaseClient;if(!t)throw new Error("Supabase 未初始化");let n;a?n={encrypted:!0,...await wt.encrypt(e,a),当前公式:e.当前公式}:n={encrypted:!1,...e};const{error:r}=await t.from("ranking_config").upsert({config_key:"scoring_formulas",config_value:n,updated_at:new Date().toISOString()},{onConflict:"config_key"});if(r)throw new Error("保存公式失败: "+r.message)}function za(e,a){if(!e||e.length===0)return[];const t=a.数据平滑||{讲解次数:.5,成交金额:.5},n=e.map(d=>{const y=(d.lecture_count||0)+t.讲解次数,b=(d.sales_amount||0)+t.成交金额;return{...d,lecture_smooth:y,sales_smooth:b,lecture_efficiency:b/y,exposure_rate_val:d.exposure_rate||0,conversion_rate_val:d.conversion_rate||0}}),r=(d,y)=>{let b=1/0,_=-1/0;return d.forEach(S=>{const B=y(S);B<b&&(b=B),B>_&&(_=B)}),{min:b,max:_,range:_-b||1}},o=r(n,d=>d.exposure_rate_val),i=r(n,d=>d.conversion_rate_val),s=r(n,d=>d.lecture_count||0),l=r(n,d=>d.lecture_efficiency),c=r(n,d=>d.lecture_smooth),u=n.map(d=>{const y=(d.exposure_rate_val-o.min)/o.range*100,b=(d.conversion_rate_val-i.min)/i.range*100,_=((d.lecture_count||0)-s.min)/s.range*100,S=(d.lecture_efficiency-l.min)/l.range*100,B=S,k=(c.max-d.lecture_smooth)/c.range*100;return{...d,exposureScore:y,conversionScore:b,lectureScore:_,efficiencyScore:S,salesScore:B,lecturePotentialScore:k}}),p=a.表现得分权重||{},g=p.转化能力||{权重:.6,点击成交率分值:.5,成交金额分值:.5},m=p.讲解效率||{权重:.4,讲解效率分值:.6,曝光点击率分值:.4},f=a.潜力得分权重||{点击成交率分值:.42,讲解效率分值:.42,潜力因子:.16},L=a.总分权重||{表现得分:.8,潜力得分:.2};return u.map(d=>{const y=(1-d.lectureScore/100)*((d.conversionScore/100+d.efficiencyScore/100)/2)*100,b=(d.conversionScore*g.点击成交率分值+d.salesScore*g.成交金额分值)*g.权重+(d.efficiencyScore*m.讲解效率分值+d.exposureScore*m.曝光点击率分值)*m.权重,_=d.conversionScore*f.点击成交率分值+d.efficiencyScore*f.讲解效率分值+y*f.潜力因子,S=b*L.表现得分+_*L.潜力得分;return{...d,potential_factor:Math.round(y*100)/100,performance_score:Math.round(b*100)/100,potential_score:Math.round(_*100)/100,total_score:Math.round(S*100)/100}})}function xe(e="请输入评分密码",a=!1){return new Promise(t=>{const n=document.createElement("div");n.style.cssText="position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center;",n.innerHTML=`
            <div style="background:var(--bg-secondary, #1e1e2e); border:1px solid var(--border-color, #333); border-radius:12px; padding:2rem; width:340px; box-shadow:0 20px 40px rgba(0,0,0,0.4);">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div style="font-size:2rem; margin-bottom:0.5rem;"><i data-lucide="lock" style="width: 48px; height: 48px;"></i></div>
                    <h3 style="color:var(--text-primary, #fff); margin:0; font-size:1.1rem;">${e}</h3>
                </div>
                <input type="password" id="scoringPwdInput" placeholder="输入密码" autocomplete="off"
                    style="width:100%; padding:0.75rem; border:1px solid var(--border-color, #444); border-radius:8px;
                    background:var(--bg-tertiary, #2a2a3e); color:var(--text-primary, #fff); font-size:1rem;
                    outline:none; box-sizing:border-box; margin-bottom:${a?"0.75rem":"1rem"};">
                ${a?`<input type="password" id="scoringPwdConfirm" placeholder="确认密码" autocomplete="off"
                    style="width:100%; padding:0.75rem; border:1px solid var(--border-color, #444); border-radius:8px;
                    background:var(--bg-tertiary, #2a2a3e); color:var(--text-primary, #fff); font-size:1rem;
                    outline:none; box-sizing:border-box; margin-bottom:1rem;">`:""}
                <div id="scoringPwdError" style="color:#ff4d4f; font-size:0.85rem; margin-bottom:0.75rem; min-height:1.2em;"></div>
                <div style="display:flex; gap:0.75rem;">
                    <button id="scoringPwdCancel" style="flex:1; padding:0.6rem; border:1px solid var(--border-color, #444);
                        border-radius:8px; background:transparent; color:var(--text-secondary, #999); cursor:pointer; font-size:0.9rem;">取消</button>
                    <button id="scoringPwdConfirmBtn" style="flex:1; padding:0.6rem; border:none; border-radius:8px;
                        background:var(--primary-color, #6366f1); color:#fff; cursor:pointer; font-size:0.9rem; font-weight:500;">确认</button>
                </div>
            </div>
        `,document.body.appendChild(n);const r=n.querySelector("#scoringPwdInput"),o=n.querySelector("#scoringPwdError"),i=n.querySelector("#scoringPwdConfirm");r.focus();const s=()=>{const c=r.value.trim();if(!c){o.textContent="请输入密码";return}if(a){const u=i==null?void 0:i.value.trim();if(c!==u){o.textContent="两次密码不一致";return}}document.body.removeChild(n),t(c)};n.querySelector("#scoringPwdConfirmBtn").addEventListener("click",s),n.querySelector("#scoringPwdCancel").addEventListener("click",()=>{document.body.removeChild(n),t(null)});const l=c=>{c.key==="Enter"&&s()};r.addEventListener("keydown",l),i&&i.addEventListener("keydown",l)})}function Ne(){return sessionStorage.getItem("scoring_pwd")}function _e(e){sessionStorage.setItem("scoring_pwd",e)}async function Pa(){var a,t;let e=Ne();try{return await fe(e)}catch(n){if(n.message==="NEED_PASSWORD"||n.message==="PASSWORD_WRONG"){const r=n.message==="PASSWORD_WRONG"?"密码错误，请重新输入":"请输入评分密码";if(e=await xe(r),!e)return null;try{const o=await fe(e);return _e(e),o}catch(o){if(o.message==="PASSWORD_WRONG")return(t=(a=window.AppUtils)==null?void 0:a.showToast)==null||t.call(a,"密码错误","error"),null;throw o}}throw n}}function Na(){return`
        <div class="ranking-page">
            <div class="page-intro">
                <h2><span style="color: white;"><i data-lucide="settings-2"></i> 评分设置</span> <span style="color: #999;">（评分公式加密存储在 ranking_config 表中）</span></h2>
                <p>
                    <span style="color: #ff9800;">🔒 公式数据已加密保护，需要密码才能查看和编辑。</span>
                </p>
            </div>

            <div id="scoringAuthGate" style="display:flex; align-items:center; justify-content:center; padding:4rem 0;">
                <div style="text-align:center;">
                    <div style="font-size:3rem; margin-bottom:1rem;"><i data-lucide="lock" style="width: 64px; height: 64px;"></i></div>
                    <p style="color:var(--text-secondary); margin-bottom:1.5rem;">请输入密码以访问评分设置</p>
                    <button class="btn btn-primary" id="btnScoringUnlock">输入密码</button>
                </div>
            </div>

            <div id="scoringContent" style="display:none;">
                <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap; padding:1rem 0; border-bottom:1px solid var(--border-color);">
                    <label style="color:var(--text-secondary); font-weight:500;">当前公式：</label>
                    <select id="scoringFormulaSelect" style="padding:0.5rem 1rem; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-tertiary); color:var(--text-primary); font-size:0.9rem; min-width:160px;"></select>
                    <button class="btn btn-secondary" id="btnNewFormula" style="font-size:0.8rem; padding:0.4rem 0.8rem;">➕ 新建</button>
                    <button class="btn btn-secondary" id="btnCopyFormula" style="font-size:0.8rem; padding:0.4rem 0.8rem;"><i data-lucide="clipboard-list"></i> 复制</button>
                    <button class="btn btn-secondary" id="btnDeleteFormula" style="font-size:0.8rem; padding:0.4rem 0.8rem; color:var(--error-color);">🗑️ 删除</button>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        <button class="btn btn-primary" id="btnSaveFormula" style="font-size:0.85rem;"><i data-lucide="save"></i> 保存公式</button>
                        <button class="btn btn-secondary" id="btnChangeScoringPwd" style="font-size:0.8rem; padding:0.4rem 0.8rem;">🔑 修改密码</button>
                    </div>
                </div>

                <div id="scoringFormulaEditor" style="padding:1.5rem 0;">
                    <!-- 动态生成 -->
                </div>

                <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                    <h4 style="color:var(--text-secondary); margin:0 0 0.75rem 0;">📝 公式预览</h4>
                    <pre id="scoringFormulaPreview" style="color:var(--text-muted); font-size:0.85rem; line-height:1.6; margin:0; white-space:pre-wrap;"></pre>
                </div>
            </div>
        </div>
    `}function Ua(e,a){const t=e.数据平滑||{},n=e.表现得分权重||{},r=n.转化能力||{},o=n.讲解效率||{},i=e.潜力得分权重||{},s=e.总分权重||{},l=(c,u,p,g="")=>`
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
            <label style="color:var(--text-secondary); min-width:140px; font-size:0.9rem;">${p}</label>
            <input type="number" id="${c}" value="${u}" step="0.01" min="0" max="1"
                style="width:80px; padding:0.4rem 0.5rem; border:1px solid var(--border-color); border-radius:6px;
                background:var(--bg-tertiary); color:var(--text-primary); font-size:0.9rem; text-align:center;">
            <span style="color:var(--text-muted); font-size:0.85rem;">${g}</span>
        </div>
    `;a.innerHTML=`
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:var(--primary-color); margin:0 0 1rem 0;">📐 数据平滑参数</h4>
                ${l("sf_smooth_lecture",t.讲解次数??.5,"讲解次数平滑值")}
                ${l("sf_smooth_sales",t.成交金额??.5,"成交金额平滑值")}
            </div>

            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:var(--primary-color); margin:0 0 1rem 0;">📊 总分权重</h4>
                ${l("sf_total_perf",s.表现得分??.8,"表现得分权重")}
                ${l("sf_total_pot",s.潜力得分??.2,"潜力得分权重")}
            </div>

            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:#22c55e; margin:0 0 1rem 0;">📈 表现得分 - 转化能力</h4>
                ${l("sf_convert_weight",r.权重??.6,"模块权重")}
                ${l("sf_convert_click",r.点击成交率分值??.5,"点击成交率分值")}
                ${l("sf_convert_sales",r.成交金额分值??.5,"成交金额分值")}
                <hr style="border-color:var(--border-color); margin:0.75rem 0;">
                <h4 style="color:#22c55e; margin:0 0 1rem 0;">📈 表现得分 - 讲解效率</h4>
                ${l("sf_lecture_weight",o.权重??.4,"模块权重")}
                ${l("sf_lecture_eff",o.讲解效率分值??.6,"讲解效率分值")}
                ${l("sf_lecture_exp",o.曝光点击率分值??.4,"曝光点击率分值")}
            </div>

            <div style="padding:1rem; background:var(--bg-tertiary); border-radius:8px; border:1px solid var(--border-color);">
                <h4 style="color:#a855f7; margin:0 0 1rem 0;">🔮 潜力得分权重</h4>
                ${l("sf_pot_click",i.点击成交率分值??.42,"点击成交率分值")}
                ${l("sf_pot_eff",i.讲解效率分值??.42,"讲解效率分值")}
                ${l("sf_pot_factor",i.潜力因子??.16,"潜力因子")}
            </div>
        </div>
    `}function Ue(){const e=a=>{var t;return parseFloat((t=document.getElementById(a))==null?void 0:t.value)||0};return{数据平滑:{讲解次数:e("sf_smooth_lecture"),成交金额:e("sf_smooth_sales")},表现得分权重:{转化能力:{权重:e("sf_convert_weight"),点击成交率分值:e("sf_convert_click"),成交金额分值:e("sf_convert_sales")},讲解效率:{权重:e("sf_lecture_weight"),讲解效率分值:e("sf_lecture_eff"),曝光点击率分值:e("sf_lecture_exp")}},潜力得分权重:{点击成交率分值:e("sf_pot_click"),讲解效率分值:e("sf_pot_eff"),潜力因子:e("sf_pot_factor")},总分权重:{表现得分:e("sf_total_perf"),潜力得分:e("sf_total_pot")}}}function Ze(){const e=document.getElementById("scoringFormulaPreview");if(!e)return;const a=Ue(),t=a.总分权重,n=a.表现得分权重.转化能力,r=a.表现得分权重.讲解效率,o=a.潜力得分权重,i=a.数据平滑;e.textContent=`数据平滑：讲解次数 + ${i.讲解次数}，成交金额 + ${i.成交金额}
讲解效率 = 成交金额平滑 / 讲解次数平滑

分值归一化（Min-Max → 0~100）：
  曝光点击率分值、点击成交率分值、讲解次数分值、讲解效率分值
  成交金额分值 = 讲解效率分值

潜力因子 = (1 - 讲解次数分值/100) × (点击成交率分值/100 + 讲解效率分值/100) / 2 × 100

表现得分 = (点击成交率×${n.点击成交率分值} + 成交金额×${n.成交金额分值})×${n.权重} + (讲解效率×${r.讲解效率分值} + 曝光点击率×${r.曝光点击率分值})×${r.权重}

潜力得分 = 点击成交率×${o.点击成交率分值} + 讲解效率×${o.讲解效率分值} + 潜力因子×${o.潜力因子}

产品总分 = 表现得分×${t.表现得分} + 潜力得分×${t.潜力得分}`}async function qa(){var u,p,g,m,f,L;let e=null,a=Ne();const t=document.getElementById("scoringAuthGate"),n=document.getElementById("scoringContent"),r=document.getElementById("scoringFormulaSelect"),o=document.getElementById("scoringFormulaEditor");(u=document.getElementById("btnScoringUnlock"))==null||u.addEventListener("click",async()=>{await i()});async function i(){var d,y,b,_;a=Ne();try{e=await fe(a),!e.encrypted&&e.encrypted,s();return}catch(S){if(S.message==="NEED_PASSWORD"||S.message==="PASSWORD_WRONG"){if(a=await xe(S.message==="PASSWORD_WRONG"?"密码错误，请重试":"请输入评分密码"),!a)return;try{e=await fe(a),_e(a),s()}catch(B){(y=(d=window.AppUtils)==null?void 0:d.showToast)==null||y.call(d,B.message==="PASSWORD_WRONG"?"密码错误":B.message,"error")}}else e=await fe(null),a=await xe("首次使用，请设置评分密码",!0),a&&(_e(a),await Me(e,a),(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"密码已设置，公式已加密保存","success")),s()}}function s(){t.style.display="none",n.style.display="block",l(),c()}function l(){r.innerHTML="";const d=e.公式列表||{};Object.keys(d).forEach(y=>{const b=document.createElement("option");b.value=y,b.textContent=y,y===e.当前公式&&(b.selected=!0),r.appendChild(b)})}function c(){var b;const d=r.value,y=(b=e.公式列表)==null?void 0:b[d];y&&(Ua(y,o),Ze(),o.querySelectorAll('input[type="number"]').forEach(_=>{_.addEventListener("input",Ze)}))}r.addEventListener("change",()=>{e.当前公式=r.value,c()}),(p=document.getElementById("btnNewFormula"))==null||p.addEventListener("click",()=>{var y,b,_,S;const d=prompt("请输入新公式名称：");if(!(!d||!d.trim())){if(e.公式列表[d]){(b=(y=window.AppUtils)==null?void 0:y.showToast)==null||b.call(y,"该名称已存在","warning");return}e.公式列表[d]=Oe().公式列表.默认公式,e.当前公式=d,l(),c(),(S=(_=window.AppUtils)==null?void 0:_.showToast)==null||S.call(_,`已新建公式：${d}`,"success")}}),(g=document.getElementById("btnCopyFormula"))==null||g.addEventListener("click",()=>{var b,_,S,B;const d=r.value,y=prompt("请输入复制后的公式名称：",d+" (副本)");if(!(!y||!y.trim())){if(e.公式列表[y]){(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"该名称已存在","warning");return}e.公式列表[y]=JSON.parse(JSON.stringify(e.公式列表[d])),e.当前公式=y,l(),c(),(B=(S=window.AppUtils)==null?void 0:S.showToast)==null||B.call(S,`已复制为：${y}`,"success")}}),(m=document.getElementById("btnDeleteFormula"))==null||m.addEventListener("click",()=>{var b,_,S,B;const d=r.value;if(Object.keys(e.公式列表).length<=1){(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"至少保留一个公式","warning");return}confirm(`确认删除公式「${d}」？`)&&(delete e.公式列表[d],e.当前公式=Object.keys(e.公式列表)[0],l(),c(),(B=(S=window.AppUtils)==null?void 0:S.showToast)==null||B.call(S,`已删除公式：${d}`,"success"))}),(f=document.getElementById("btnSaveFormula"))==null||f.addEventListener("click",async()=>{var d,y,b,_;try{const S=r.value;e.公式列表[S]=Ue(),e.当前公式=S,await Me(e,a),(y=(d=window.AppUtils)==null?void 0:d.showToast)==null||y.call(d,"公式已加密保存","success")}catch(S){(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"保存失败: "+S.message,"error")}}),(L=document.getElementById("btnChangeScoringPwd"))==null||L.addEventListener("click",async()=>{var y,b,_,S;const d=await xe("请设置新密码",!0);if(d)try{a=d,_e(d);const B=r.value;e.公式列表[B]=Ue(),await Me(e,d),(b=(y=window.AppUtils)==null?void 0:y.showToast)==null||b.call(y,"密码已修改，公式已重新加密","success")}catch(B){(S=(_=window.AppUtils)==null?void 0:_.showToast)==null||S.call(_,"修改失败: "+B.message,"error")}}),a&&await i()}const ge={虚拟分类:"virtual_category",实际库存数:"actual_stock",评分排名:"rating_rank",产品总分:"total_score",是否可佩戴:"is_wearable",商品分类:"product_category",可用数:"available_qty",仓位:"warehouse",商品编码:"product_code",商品名称:"product_name",图片网址:"image_url",颜色规格:"color_spec",商品标签:"product_tag",价格:"price"},le=["虚拟分类","实际库存数","评分排名","产品总分","是否可佩戴","商品分类","可用数","商品标签"];async function Ra(){var f,L;console.log("📥 [数据加载] 开始加载库存+评分数据...");const e=window.supabaseClient;if(!e)throw new Error("Supabase 未初始化");const[a,t,n]=await Promise.all([e.from("ranking_data").select("*"),e.from("inventory_data").select("*"),e.from("excluded_non_wearables").select("product_name")]);if(a.error)throw new Error("读取 ranking_data 失败: "+a.error.message);if(t.error)throw new Error("读取 inventory_data 失败: "+t.error.message);const r=await Pa(),o=(r==null?void 0:r.当前公式)||"默认公式",i=((f=r==null?void 0:r.公式列表)==null?void 0:f[o])||Oe().公式列表.默认公式,s=a.data||[],l=za(s,i);console.log(`📊 [前端评分] 使用公式「${o}」计算了 ${l.length} 个商品的评分`);const c=new Map;l.forEach(d=>{d.product_name&&c.set(d.product_name,{total_score:d.total_score||0,sales_amount:d.sales_amount||0,lecture_count:d.lecture_count||0,performance_score:d.performance_score||0,potential_score:d.potential_score||0})});const u=new Set((n.data||[]).map(d=>d.product_name)),p=new Map,g=(d,y)=>{if(!y)return d;if(!d)return y;const b=new Set(d.split(",").map(S=>S.trim()).filter(Boolean));return y.split(",").map(S=>S.trim()).filter(Boolean).forEach(S=>b.add(S)),Array.from(b).join(",")};(t.data||[]).forEach(d=>{if(!d.product_name)return;const y=!u.has(d.product_name);if(p.has(d.product_name)){const b=p.get(d.product_name);b.available_qty+=d.available_qty||0,b.actual_stock+=d.actual_stock||0,b.virtual_category=g(b.virtual_category,d.virtual_category),b.product_category=g(b.product_category,d.product_category),b.product_code=g(b.product_code,d.product_code),b.warehouse=g(b.warehouse,d.warehouse),!b.image_url&&d.image_url&&(b.image_url=d.image_url)}else p.set(d.product_name,{product_name:d.product_name,available_qty:d.available_qty||0,actual_stock:d.actual_stock||0,virtual_category:d.virtual_category||"",product_category:d.product_category||"",product_code:d.product_code||"",image_url:d.image_url||"",warehouse:d.warehouse||"",is_wearable:y,total_score:0,rating_rank:999999,sales_amount:0,lecture_count:0,exposure_rate:0,conversion_rate:0})}),c.forEach((d,y)=>{const b=p.get(y);b&&Object.assign(b,d)});const m=Array.from(p.values());return m.filter(d=>d.total_score>0).sort((d,y)=>y.total_score-d.total_score).forEach((d,y)=>{d.rating_rank=y+1}),console.log(`<i data-lucide="check-circle"></i> [数据加载] 完成: 评分数据 ${s.length} 条, 库存数据 ${((L=t.data)==null?void 0:L.length)||0} 条, 汇总商品 ${m.length} 个`),m}async function Ha(){console.log("🌟 [新品加载] 开始从 new_product_data 加载...");const e=window.supabaseClient;if(!e)throw new Error("Supabase 未初始化");const{data:a,error:t}=await e.from("new_product_data").select("*");if(t)throw new Error("读取 new_product_data 失败: "+t.message);const n=a||[],r=n.length,o=new Map;n.forEach(l=>{const c=l.product_name;if(!c)return;const u=o.get(c);u?(l.image_url&&!u.image_url.includes(l.image_url)&&(u.image_url=u.image_url?`${u.image_url}, ${l.image_url}`:l.image_url),l.color_spec&&!u.color_spec.includes(l.color_spec)&&(u.color_spec=u.color_spec?`${u.color_spec}, ${l.color_spec}`:l.color_spec),l.product_code&&!u.product_code.includes(l.product_code)&&(u.product_code=u.product_code?`${u.product_code}, ${l.product_code}`:l.product_code),l.warehouse&&!u.warehouse.includes(l.warehouse)&&(u.warehouse=u.warehouse?`${u.warehouse}, ${l.warehouse}`:l.warehouse),!u.category&&l.category&&(u.category=l.category),!u.product_tag&&l.product_tag&&(u.product_tag=l.product_tag),!u.price&&l.price&&(u.price=l.price)):o.set(c,{product_name:c,image_url:l.image_url||"",category:l.category||"",color_spec:l.color_spec||"",product_code:l.product_code||"",warehouse:l.warehouse||"",product_tag:l.product_tag||"",price:l.price||"",virtual_category:l.virtual_category||""})});const i=o.size,s=Array.from(o.values());return s._deduplicateStats={before:r,after:i},console.log(`<i data-lucide="check-circle"></i> [新品加载] 完成: 原始 ${r} 条, 去重后 ${i} 个商品`),s}async function xt(){const e=window.supabaseClient;if(!e)return[];const{data:a,error:t}=await e.from("excluded_products").select("*");return t?(console.warn("读取排除商品失败:",t.message),[]):a||[]}async function ja(e,a=""){const t=window.supabaseClient;if(!t)throw new Error("Supabase 未初始化");const{error:n}=await t.from("excluded_products").insert({product_name:e.trim(),reason:a,created_at:new Date().toISOString()});if(n)throw new Error("添加排除商品失败: "+n.message);return!0}async function Fa(e){const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");const{error:t}=await a.from("excluded_products").delete().eq("product_name",e);if(t)throw new Error("删除排除商品失败: "+t.message);return!0}async function Oa(){const e=window.supabaseClient;if(!e)return[];const{data:a,error:t}=await e.from("excluded_non_wearables").select("*").order("created_at",{ascending:!1});return t?(console.warn("读取排除不可佩戴品失败:",t.message),[]):a||[]}async function Wa(e){const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");const{error:t}=await a.from("excluded_non_wearables").insert({product_name:e.trim()});if(t)throw new Error("添加失败: "+t.message);return!0}async function Ka(e){const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");const{error:t}=await a.from("excluded_non_wearables").delete().eq("product_name",e);if(t)throw new Error("删除失败: "+t.message);return!0}function Xa(e,a){const t=new Set(a.map(n=>n.product_name));return e.filter(n=>!t.has(n.product_name))}async function _t(e="filter_config"){console.log(`⚙️ [配置加载] 正在加载配置: ${e}`);const a=window.supabaseClient;if(!a)return null;const{data:t,error:n}=await a.from("ranking_config").select("config_value").eq("config_key",e).single();return n?(console.warn('<i data-lucide="alert-triangle"></i> [配置加载] 失败, 使用默认配置:',n.message),ve()):(console.log(`<i data-lucide="check-circle"></i> [配置加载] 成功加载配置: ${e}`),(t==null?void 0:t.config_value)||ve())}async function Se(e,a){console.log(`<i data-lucide="save"></i> [配置保存] 正在保存配置: ${e}`);const t=window.supabaseClient;if(!t)throw new Error("Supabase 未初始化");const{error:n}=await t.from("ranking_config").upsert({config_key:e,config_value:a,updated_at:new Date().toISOString()},{onConflict:"config_key"});if(n)throw console.error('<i data-lucide="x-circle"></i> [配置保存] 失败:',n.message),new Error("保存配置失败: "+n.message);return console.log(`<i data-lucide="check-circle"></i> [配置保存] 成功: ${e}`),!0}function Va(){return{当前方案:"默认方案",方案列表:{默认方案:ve()}}}async function kt(){console.log("⚙️ [方案加载] 正在加载排品方案...");const e=window.supabaseClient;if(!e)return Va();const{data:a,error:t}=await e.from("ranking_config").select("config_value").eq("config_key","ranking_schemes").single();return t||!(a!=null&&a.config_value)?(console.log("⚙️ [方案加载] 无方案数据，尝试迁移旧配置..."),await Qa()):(console.log('<i data-lucide="check-circle"></i> [方案加载] 成功'),a.config_value,a.config_value)}async function ce(e){console.log('<i data-lucide="save"></i> [方案保存] 正在保存排品方案...'),await Se("ranking_schemes",e);const a=e.方案列表[e.当前方案];a&&await Se("filter_config",a),console.log('<i data-lucide="check-circle"></i> [方案保存] 成功')}function oe(e,a){return e.方案列表[a]||ve()}async function Qa(){console.log('<i data-lucide="refresh-cw"></i> [迁移] 将旧 filter_config 迁移为默认方案...');const a={当前方案:"默认方案",方案列表:{默认方案:await _t("filter_config")||ve()}};return await Se("ranking_schemes",a),console.log('<i data-lucide="check-circle"></i> [迁移] 完成'),a}function ve(){return{分类排序:["评分品A筛选条件","佩戴品筛选条件","周边品筛选条件","评分品B筛选条件","库存品筛选条件"],结果映射:{评分品A筛选条件:"1.评分品A",佩戴品筛选条件:"2.佩戴品",周边品筛选条件:"3.周边品",评分品B筛选条件:"4.评分品B",库存品筛选条件:"5.库存品"},样品序号规则:{"1.评分品A":{prefix:"A",start:2,step:2},"2.佩戴品":{prefix:"P",start:1,step:1},"3.周边品":{prefix:"Z",start:1,step:1},"4.评分品B":{prefix:"B",start:1,step:1},"5.库存品":{prefix:"A",start:22,step:2}},新品序号规则:{prefix:"N",start:1,step:1},筛选条件:{评分品A筛选条件:{虚拟分类:{等于:["可预售"],启用:!0},实际库存数:{大于等于:1,启用:!0},评分排名:{前几名:10,启用:!0}},佩戴品筛选条件:{是否可佩戴:{排除:["不可佩戴"],启用:!0},商品分类:{包含:["发圈","发夹 - 鸭嘴夹","周边 - 项链","周边 - 戒指","周边 - 手链","周边 - 耳钉","周边 - 胸针"],启用:!0},可用数:{大于等于:2,启用:!0},按子分类分别筛选:!0,子分类字段:"商品分类"},周边品筛选条件:{商品分类:{包含:["周边"],启用:!0},可用数:{前几名:4,启用:!0}},评分品B筛选条件:{可用数:{大于等于:3,启用:!0},评分排名:{前几名:15,启用:!0}},库存品筛选条件:{可用数:{前几名:10,启用:!0}}}}}function Ja(e,a,t={}){const n=new Set,r={};console.log("[排品调试] 开始计算，商品总数:",e.length),console.log("[排品调试] 分类排序:",a.分类排序);for(const o of a.分类排序){const i=a.筛选条件[o];if(!i){console.log(`[排品调试] ${o}: 无筛选条件，跳过`);continue}let s=e.filter(u=>!n.has(u.product_name));const l=a.结果映射[o]||o,c=t[l]||[];c.length>0&&(s=s.filter(u=>!c.includes(u.product_name)),console.log(`[排品调试] ${o}: 排除已删除商品 ${c.length} 个`)),console.log(`[排品调试] ${o}: 可用商品数=${s.length}, 按子分类筛选=${i.按子分类分别筛选}, 选中子分类=${JSON.stringify(i.选中子分类)}`),o.includes("库存品")?s=qe(s,i):i.按子分类分别筛选?(console.log(`[排品调试] ${o}: 调用 filterBySubcategory`),s=Ga(s,i),console.log(`[排品调试] ${o}: filterBySubcategory 返回 ${s.length} 个商品`)):s=qe(s,i),console.log(`[排品调试] ${o}: 筛选后商品数=${s.length}`),s.forEach(u=>n.add(u.product_name)),r[l]=s}return r}function qe(e,a){let t=[...e];for(const[n,r]of Object.entries(a)){if(n==="按子分类分别筛选"||n==="子分类字段"||!r.启用)continue;if(r.conditions&&Array.isArray(r.conditions)){t=t.filter(i=>r.conditions.every(s=>{const l=ge[s.field]||s.field,c=s.operator,u=s.value;return c==="前几名"||c==="后几名"?!0:Ya(i,l,c,u,s.field)}));for(const i of r.conditions){if(i.operator==="前几名"&&i.value){const s=ge[i.field]||i.field;i.field==="评分排名"?t=t.sort((c,u)=>(c[s]??999999)-(u[s]??999999)):t=t.sort((c,u)=>(u[s]||0)-(c[s]||0)),t=t.slice(0,parseInt(i.value))}if(i.operator==="后几名"&&i.value){const s=ge[i.field]||i.field;i.field==="评分排名"?t=t.sort((c,u)=>(c[s]??999999)-(u[s]??999999)):t=t.sort((c,u)=>(u[s]||0)-(c[s]||0)),t=t.slice(-parseInt(i.value))}}continue}const o=ge[n]||n;if(n==="是否可佩戴"){r.排除&&r.排除.includes("不可佩戴")&&(t=t.filter(i=>i[o]===!0));continue}if(r.大于等于!==void 0&&(t=t.filter(i=>(i[o]||0)>=r.大于等于)),r.小于等于!==void 0&&(t=t.filter(i=>(i[o]||0)<=r.小于等于)),r.等于){const i=Array.isArray(r.等于)?r.等于:[r.等于];t=t.filter(s=>i.includes(s[o]))}if(r.包含){const i=Array.isArray(r.包含)?r.包含:[r.包含];t=t.filter(s=>{const l=s[o]||"";return i.some(c=>l.includes(c))})}if(r.排除){const i=Array.isArray(r.排除)?r.排除:[r.排除];t=t.filter(s=>{const l=s[o]||"";return!i.some(c=>l.includes(c))})}r.前几名&&(r.排序方式==="升序"||n==="评分排名"?t=t.sort((s,l)=>(s[o]??999999)-(l[o]??999999)):t=t.sort((s,l)=>(l[o]||0)-(s[o]||0)),t=t.slice(0,r.前几名)),r.后几名&&(r.排序方式==="升序"||n==="评分排名"?t=t.sort((s,l)=>(s[o]??999999)-(l[o]??999999)):t=t.sort((s,l)=>(l[o]||0)-(s[o]||0)),t=t.slice(-r.后几名))}return t}function Ya(e,a,t,n,r){const o=e[a],i=String(o??"");switch(t){case"大于等于":return(o||0)>=n;case"小于等于":return(o||0)<=n;case"等于":return Array.isArray(n)?n.includes(o):o==n;case"包含":return(Array.isArray(n)?n:[n]).some(c=>i.includes(String(c)));case"排除":const l=Array.isArray(n)?n:[n];return r==="是否可佩戴"&&l.includes("不可佩戴")?o===!0:!l.some(c=>i.includes(String(c)));case"前几名":case"后几名":return!0;default:return!0}}function Ga(e,a){const t=a.子分类字段||"商品分类",n=ge[t]||t,r=a.选中子分类||[];console.log(`[filterBySubcategory] 输入商品数: ${e.length}`),console.log(`[filterBySubcategory] 子分类字段: ${t} -> ${n}`),console.log(`[filterBySubcategory] 选中子分类: ${JSON.stringify(r)}`);const o=new Map;let i=qe(e,a);if(console.log(`[filterBySubcategory] applyFilters后商品数: ${i.length}`),r.length>0){const l=i.slice(0,10).map(c=>c[n]);console.log(`[filterBySubcategory] 商品分类样本: ${JSON.stringify(l)}`),i=i.filter(c=>{const u=c[n]||"";return r.includes(u)}),console.log(`[filterBySubcategory] 按选中子分类过滤后: ${i.length}`)}i.forEach(l=>{const c=l[n]||"其他";o.has(c)||o.set(c,[]),o.get(c).push(l)}),console.log(`[filterBySubcategory] 分组数量: ${o.size}`);const s=[];return o.forEach(l=>{l.sort((c,u)=>(u.available_qty||0)-(c.available_qty||0)),l.length>0&&s.push(l[0])}),console.log(`[filterBySubcategory] 最终结果: ${s.length}`),s}function Za(e,a){const t=[];for(const[n,r]of Object.entries(e)){const o=a.样品序号规则[n]||{prefix:"X",start:1,step:1};let i=o.start;r.forEach(s=>{const l=`${o.prefix}${String(i).padStart(2,"0")}`;t.push({...s,ranking_result:n,sample_number:l}),i+=o.step})}return t}async function en(e){console.log(`<i data-lucide="save"></i> [结果保存] 开始保存排品结果到 ranking_results, 共 ${e.length} 条`);const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");console.log("🧹 [结果保存] 清空现有结果..."),await a.from("ranking_results").delete().gte("id",0);const t=e.map(r=>({product_name:r.product_name,product_id:ue[r.product_name]||r.product_id||"",shop:Ee[r.product_name]||r.shop||null,ranking_result:r.ranking_result,sample_number:r.sample_number,image_url:r.image_url||null,product_code:r.product_code||null,warehouse:r.warehouse||null,total_score:r.total_score||0,rating_rank:r.rating_rank||null,is_wearable:r.is_wearable!==void 0?r.is_wearable:null,available_qty:r.available_qty||0,actual_stock:r.actual_stock||0})),n=100;for(let r=0;r<t.length;r+=n){const o=t.slice(r,r+n);console.log(`<i data-lucide="upload"></i> [结果保存] 插入批次 ${Math.floor(r/n)+1}/${Math.ceil(t.length/n)}`);const{error:i}=await a.from("ranking_results").insert(o);if(i)throw new Error("保存结果失败: "+i.message)}return console.log(`<i data-lucide="check-circle"></i> [结果保存] 完成, 共保存 ${t.length} 条记录`),t.length}function tn(){return`
        <div class="ranking-page">
            <div class="page-intro">
                <h2><span style="color: white;"><i data-lucide="clipboard-list"></i> 排品计算</span><span style="color: #999;">（从评分和库存表汇总数据，按配置规则进行排品计算）</span></h2>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); border-left: 3px solid #eab308; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #eab308; font-weight: bold; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.1rem;"><i data-lucide="alert-triangle"></i></span> <span style="letter-spacing: 1px;">步骤 1: 核对状态</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.9; line-height: 1.4; white-space: nowrap;">需与主播核对评分品<span style="color: #eab308; font-weight: bold;">【预售状态】</span></div>
                    </div>
                    <div style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-left: 3px solid #10b981; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-weight: bold; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.1rem;"><i data-lucide="save"></i></span> <span style="letter-spacing: 1px;">步骤 2: 保存结果</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.9; line-height: 1.4; white-space: nowrap;">计算后需保存，才可执行影刀<span style="color: #10b981; font-weight: bold;">【控库存】</span>操作。</div>
                    </div>
                    <div style="flex: 1; min-width: 200px; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-left: 3px solid #ef4444; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #ef4444; font-weight: bold; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.1rem;"><i data-lucide="rocket"></i></span> <span style="letter-spacing: 1px;">步骤 3: 推送排品</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.9; line-height: 1.4; white-space: nowrap;">更新排品后，需要执行<a href="#mapping" style="color: #ef4444; text-decoration: underline; cursor: pointer; font-weight: bold;">【排品推送】</a>才可生成对照表。</div>
                    </div>
                </div>
            </div>
            
            <!-- 上部分：数据统计 + 选项 + 按钮（横向排列） -->
            <style>
                .hover-zoom-container {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    margin: 0 auto;
                    cursor: zoom-in;
                }
                .hover-zoom-thumb {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    display: block;
                }

            </style>
            <div class="ranking-top-bar" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem 1.5rem; background: var(--bg-secondary); margin: 1rem 0; border-radius: var(--border-radius); white-space: nowrap; overflow-x: auto;">
                <!-- 统计数据（横向排列） -->
                <div class="ranking-stats-inline" style="display: flex; gap: 1.5rem; flex: 1;">
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">排名数据</span>
                        <span class="stat-value-sm" id="statRanking">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">库存数据</span>
                        <span class="stat-value-sm" id="statInventory">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">新品数据</span>
                        <span class="stat-value-sm" id="statNewProduct">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">排除商品</span>
                        <span class="stat-value-sm" id="statExcluded">--</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="stat-label-sm">参与排品</span>
                        <span class="stat-value-sm" id="statCombined">--</span>
                    </div>
                </div>
                
                <!-- 方案选择 -->
                <div class="stat-item-inline" style="border-left: 1px solid var(--border-color); padding-left: 1rem;">
                    <span class="stat-label-sm">排品方案</span>
                    <select id="rankingSchemeSelect" class="input" style="padding: 0.3rem 0.5rem; font-size: 0.8rem; min-width: 120px;">
                        <option>加载中...</option>
                    </select>
                </div>

                <!-- 切换选项 -->
                <div class="toggle-btn-group" style="display: flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color);">
                    <button type="button" class="toggle-btn active" id="btnExcludeNew" onclick="setNewProductMode(false)" style="padding: 0.5rem 0.75rem; font-size: 0.75rem; border: none; background: var(--primary-color); color: white; cursor: pointer; transition: all 0.2s;">
                        排除新品<span style="font-size: 0.625rem; opacity: 0.8; display: block;">开播前</span>
                    </button>
                    <button type="button" class="toggle-btn" id="btnIncludeNew" onclick="setNewProductMode(true)" style="padding: 0.5rem 0.75rem; font-size: 0.75rem; border: none; background: var(--bg-secondary); color: var(--text-secondary); cursor: pointer; transition: all 0.2s;">
                        包含新品<span style="font-size: 0.625rem; opacity: 0.8; display: block;">下播调拨</span>
                    </button>
                </div>
                <input type="hidden" id="includeNewProducts" value="false">
                
                <!-- 按钮 -->
                <button class="btn btn-primary" id="btnLoadAndCalculate">加载数据并计算</button>
            </div>
            
            <!-- 下部分：排品结果（全宽） -->
            <div class="upload-block" id="block-ranking-result" style="margin: 0 0 1.5rem;">

                
                <div class="scrollable-content" id="rankingResultContent">
                    <div class="placeholder-content" style="padding: 2rem 0; color: var(--text-muted);">
                        <p>请点击"加载数据并计算"按钮</p>
                    </div>
                </div>
                
                <div class="upload-actions" style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn btn-primary" id="btnSaveResults" disabled style="display: inline-flex; align-items: center; gap: 0.5rem; height: 40px; line-height: 1;">
                        保存结果到数据库 <span style="background: rgba(255,255,255,0.2); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: normal; font-family: monospace;">ranking_results</span>
                    </button>
                    <span class="tag-shadowbot">保存后可供影刀读取-可控库存/开预售</span>
                    <button class="btn btn-secondary" onclick="window.location.hash='#arrangement-check'; window.dispatchEvent(new HashChangeEvent('hashchange'));" style="margin-left: 1rem; height: 40px; line-height: 1;"><i data-lucide="package"></i> 历史排品</button>
                </div>
            </div>
        </div>
    `}function an(){return`
        <div class="ranking-settings-page rankings-split-layout">
            <div class="page-intro">
                <h2>⚙️ 排品设置</h2>
                <p>配置筛选分类及其对应的筛选条件</p>
            </div>
            
            <!-- 方案管理栏 -->
            <div class="scheme-manager-bar" style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 1rem; background:var(--bg-secondary); border-radius:var(--border-radius); margin-bottom:1rem;">
                <span style="font-size:0.8rem; color:var(--text-muted); white-space:nowrap; flex-shrink:0;">📑 排品方案</span>
                <select id="schemeSelector" class="input" style="flex:1; min-width:0; padding:0.35rem 0.6rem; font-size:0.85rem;">
                    <option>加载中...</option>
                </select>
                <div style="display:flex; gap:0.3rem; flex-shrink:0;">
                    <button class="btn btn-sm btn-primary" id="btnNewScheme" title="新建方案" style="padding:0.35rem 0.7rem; font-size:0.8rem;">+ 新建</button>
                    <button class="btn btn-sm btn-secondary" id="btnCopyScheme" title="复制当前方案" style="padding:0.35rem 0.7rem; font-size:0.8rem;">📋 复制</button>
                    <button class="btn btn-sm btn-secondary" id="btnRenameScheme" title="重命名方案" style="padding:0.35rem 0.7rem; font-size:0.8rem;">✏️ 重命名</button>
                    <button class="btn btn-sm btn-secondary" id="btnDeleteScheme" title="删除方案" style="padding:0.35rem 0.6rem; font-size:0.8rem; color:#ef4444;">🗑️</button>
                </div>
            </div>
            
            <div class="settings-split-container">
                <!-- 左侧：分类列表 -->
                <div class="settings-split-left">
                    <div class="panel-header" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="font-size:1rem; margin:0;">分类列表</h3>
                        <button class="btn btn-sm btn-primary" id="btnAddCategory" title="添加分类">+</button>
                    </div>
                    <ul class="sortable-list" id="categoryOrderList" style="flex:1;">
                        <li class="placeholder">加载中...</li>
                    </ul>
                    <div class="category-add-area" style="margin-top:1rem; display:none; padding-top:1rem; border-top:1px solid var(--border-color);" id="addCategoryContainer">
                         <input type="text" id="newCategoryInput" class="input" placeholder="输入名称..." style="width:100%; margin-bottom:0.5rem;">
                         <div style="display:flex; gap:0.5rem;">
                             <button class="btn btn-sm btn-primary" id="btnConfirmAddCategory" style="flex:1;">确认</button>
                             <button class="btn btn-sm btn-secondary" id="btnCancelAddCategory" style="flex:1;">取消</button>
                         </div>
                    </div>
                </div>
                
                <!-- 右侧：筛选条件 -->
                <div class="settings-split-right">
                    <div class="panel-header" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem; margin:0;" id="filterSettingsTitle">筛选条件设置</h3>
                            <p class="text-muted" style="font-size:0.8rem; margin:0.25rem 0;" id="filterSettingsSubtitle">请从左侧选择一个分类进行配置</p>
                        </div>
                        <div class="settings-actions">
                             <button class="btn btn-primary" id="btnSaveSettings">保存设置</button>
                        </div>
                    </div>
                    <div id="filterConditionsContainer">
                        <div class="placeholder-content" style="padding:2rem 0;">
                            <p>请点击左侧分类以编辑筛选条件</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 排品序号分配区域 -->
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size:1rem; margin:0;">🔢 排品序号分配</h3>
                        <p class="text-muted" style="font-size:0.8rem; margin:0.25rem 0 0;">配置各分类的生成样品序号规则</p>
                    </div>
                    <button class="btn btn-primary" id="btnSaveAssignment">保存规则</button>
                </div>
                <div id="sampleRulesContainer" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:1rem;">
                    <p>加载中...</p>
                </div>
            </div>
        </div>
    `}function nn(){return`
        <div class="ranking-assignment-page">
            <div class="page-intro">
                <h2>🔢 排品序号分配</h2>
                <p>配置各分类及新品的生成样品序号规则</p>
            </div>
            
             <div class="ranking-options" style="margin-bottom: 2rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); display:flex; justify-content:space-between; align-items:center;">
                <span class="text-muted">此处配置的规则将用于生成最终排品结果中的样品序号</span>
                <button class="btn btn-primary" id="btnSaveAssignment">保存规则</button>
            </div>

            <div class="settings-split-container">
                <!-- 左侧：分类序号规则 -->
                <div class="card settings-split-left" style="height:auto; width: 100%;">
                    <div class="card-header">
                        <h3>分类序号规则</h3>
                    </div>
                     <div class="card-body">
                         <div id="sampleRulesContainer" style="display:grid; grid-template-columns: 1fr; gap:1rem;">
                            <p>加载中...</p>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    `}function rn(){return`
        <div class="ranking-exclusion-page">
             <div class="page-intro">
                <h2>🚫 排除商品设置</h2>
                <p>管理不参与排品的商品名单以及不可佩戴品名单</p>
            </div>
            
            <div class="settings-split-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                <!-- 左侧：排除商品 -->
                <div class="card settings-split-left" style="height:auto;">
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>排除列表 <span class="db-table-tag">→ excluded_products</span></h3>
                    </div>
                    <div class="card-body">
                         <div class="input-group" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="excludeInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddExclude">添加</button>
                        </div>
                        <div class="excluded-list-container" style="max-height:500px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--border-radius-sm);">
                            <table class="data-table" style="width:100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align:left; padding:0.75rem;">商品名称</th>
                                        <th style="width:60px; text-align:center; padding:0.75rem;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="excludedListBody">
                                    <tr><td colspan="2" class="text-center" style="padding:2rem;">加载中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 右侧：不可佩戴品 -->
                <div class="card settings-split-right" style="height:auto;">
                    <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>不可佩戴品 <span class="db-table-tag">→ excluded_non_wearables</span></h3>
                    </div>
                    <div class="card-body">
                         <div class="input-group" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                            <input type="text" id="excludeNonWearableInput" class="input" placeholder="输入商品名称..." style="flex:1;">
                            <button class="btn btn-primary" id="btnAddNonWearable">添加</button>
                        </div>
                        <div class="excluded-list-container" style="max-height:500px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--border-radius-sm);">
                            <table class="data-table" style="width:100%;">
                                <thead>
                                    <tr>
                                        <th style="text-align:left; padding:0.75rem;">商品名称</th>
                                        <th style="width:60px; text-align:center; padding:0.75rem;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="excludedNonWearableListBody">
                                    <tr><td colspan="2" class="text-center" style="padding:2rem;">加载中...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}function on(){return`
        <div class="ranking-check-page">
            <div class="page-intro">
                <h2>🔍 排品检查</h2>
                <p>查看数据库中已保存的排品结果</p>
            </div>
            
            <!-- 悬浮放大图片样式 -->
            <style>
                .hover-zoom-container {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    margin: 0 auto;
                    cursor: zoom-in;
                }
                .hover-zoom-thumb {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    display: block;
                }

            </style>
            
            <!-- 已保存排品结果（从数据库读取） -->
            <div class="upload-block" id="block-saved-ranking-result" style="margin: 1rem 0 1.5rem; min-height: 400px;">
                <div class="block-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="margin: 0; font-size: 1rem;" class="flex-center gap-sm"><i data-lucide="package"></i> 已保存排品结果 <span class="db-table-tag">← ranking_results</span> <span class="tag-red">保存后可供影刀读取-可控库存/开预售</span></h3>
                    <button class="btn btn-sm" id="btnRefreshSavedResults" style="font-size: 0.75rem; height: 32px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;"><i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> 刷新</button>
                </div>
                <div class="scrollable-content" id="savedRankingResultContent" style="max-height: 600px; overflow-y: auto;">
                    <div class="placeholder-content">
                        <p>加载中...</p>
                    </div>
                </div>
            </div>
        </div>
    `}async function sn(){const e=document.getElementById("btnRefreshSavedResults");await tt(),e&&e.addEventListener("click",async()=>{var a,t;e.disabled=!0,e.textContent="刷新中...",await tt(),e.disabled=!1,e.innerHTML='<i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> 刷新',(t=(a=window.AppUtils)==null?void 0:a.showToast)==null||t.call(a,"已刷新","success")})}let be=[],de=[],Ae=[],he=[],ue={},Ee={},$e=[],et={},ln=null;function Ce(e){const a=String(e??"").trim();return["1","2","3","4","5"].includes(a)?a:""}function cn(e,a){const t=new Set(String(e||"").split(",").map(Ce).filter(Boolean)),n=Ce(a);return n&&t.add(n),Array.from(t).sort((r,o)=>Number(r)-Number(o)).join(",")}function St(e){const a=String(e||"").split(",").map(Ce).filter(Boolean);return a.length===0?'<span style="color: var(--text-muted);">--</span>':a.map(t=>`<span class="shop-badge" data-shop="${t}">${t}号</span>`).join("")}async function Et(){const e=window.supabaseClient;if(!e)return{};let a=[],t=0;const n=1e3;let r=!0;for(;r;){const{data:s,error:l}=await e.from("product_id_data").select("*").range(t*n,(t+1)*n-1);if(l)return console.warn("加载商品ID失败:",l.message),{};s&&s.length>0?(a=a.concat(s),s.length<n?r=!1:t++):r=!1}const o={},i={};return a.forEach(s=>{if(s.product_name){o[s.product_name]=s.product_id||"";const l=Ce(s.shop??s.店铺);l&&(i[s.product_name]=cn(i[s.product_name],l))}}),{productIds:o,productShops:i}}async function dn(){const e=document.getElementById("btnLoadAndCalculate"),a=document.getElementById("btnSaveResults"),t=document.getElementById("rankingSchemeSelect"),n=await kt();if(t){const r=Object.keys(n.方案列表);t.innerHTML=r.map(o=>`<option value="${o}" ${o===n.当前方案?"selected":""}>${o}</option>`).join("")}e&&e.addEventListener("click",async()=>{var r,o,i,s,l;try{e.disabled=!0,e.textContent="加载中...",$e=[];const c=((r=document.getElementById("includeNewProducts"))==null?void 0:r.value)==="true",u=window.supabaseClient,[p,g,m]=await Promise.all([u.from("ranking_data").select("*",{count:"exact",head:!0}),u.from("inventory_data").select("*",{count:"exact",head:!0}),u.from("new_product_data").select("*",{count:"exact",head:!0})]);document.getElementById("statRanking").textContent=p.count||0,document.getElementById("statInventory").textContent=g.count||0,document.getElementById("statNewProduct").textContent=c?m.count||0:`${m.count||0}（未参与）`;const[f,L]=await Promise.all([xt(),Et()]);Ae=f,ue=L.productIds||{},Ee=L.productShops||{},document.getElementById("statExcluded").textContent=Ae.length;let d=await Ra(),y=d.length,b=0,_=0;de=await Ha();const S=de._deduplicateStats||{before:m.count,after:de.length};if(c)document.getElementById("statNewProduct").textContent=`${S.after}/${S.before}`,de.forEach(P=>{d.find(h=>h.product_name===P.product_name)||(d.push({...P,rating_rank:999999,total_score:0,is_new_product:!0}),b++)});else{const P=new Set(de.map($=>$.product_name)),h=d.length;d=d.filter($=>!P.has($.product_name)),_=h-d.length,y=d.length,document.getElementById("statNewProduct").innerHTML=`${S.after}/${S.before}<span title="排除的为多SKU部分商品（重复商品名称的新品）" style="cursor: help; border-bottom: 1px dashed currentColor;">（已排除${_}个）</span>`,de=[]}const B=d.length;be=Xa(d,Ae);const k=be.length,v=B-k,C=be.length;document.getElementById("statCombined").textContent=C,e.textContent="计算中...";const I=(t==null?void 0:t.value)||n.当前方案,D=oe(n,I);ln=D,et={},$e=[];const M=Ja(be,D,et);he=Za(M,D),un(he),a.disabled=!1,(i=(o=window.AppUtils)==null?void 0:o.showToast)==null||i.call(o,`排品完成，共 ${he.length} 个商品`,"success")}catch(c){console.error("加载/计算失败:",c),(l=(s=window.AppUtils)==null?void 0:s.showToast)==null||l.call(s,"加载/计算失败: "+c.message,"error")}finally{e.disabled=!1,e.textContent="加载数据并计算"}}),a&&a.addEventListener("click",async()=>{var r,o,i,s,l,c;try{a.disabled=!0,a.textContent="保存中...";const u=await en(he);(o=(r=window.AppUtils)==null?void 0:r.showToast)==null||o.call(r,`已保存 ${u} 条结果到数据库`,"success"),(s=(i=window.AppUtils)==null?void 0:i.showCenterAlert)==null||s.call(i,'<div style="display: flex; align-items: center; justify-content: center; white-space: nowrap;"><strong style="color: #ffffff; font-size: 1.05em; margin-right: 6px;">保存成功！</strong><span style="color: #ffffff;">先要做<strong style="color: #ffffff;">【福利排品】</strong>，然后再做【排品推送】。</span></div>','<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" class="animate-icon" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'),setTimeout(()=>{const m=document.querySelector(".center-alert-overlay");m&&(m.style.animation="fadeIn 0.2s ease reverse",setTimeout(()=>m.remove(),200)),window.location.hash="#welfare-ranking"},5e3)}catch(u){console.error("保存失败:",u),(c=(l=window.AppUtils)==null?void 0:l.showToast)==null||c.call(l,"保存失败: "+u.message,"error")}finally{a.disabled=!1,a.textContent="保存结果到数据库"}})}function un(e){const a=document.getElementById("rankingResultContent");if(!a)return;const t={};e.forEach(c=>{t[c.ranking_result]||(t[c.ranking_result]=[]),t[c.ranking_result].push(c)});const n=e.filter(c=>!ue[c.product_name]),r=n.length,o=n.map(c=>c.product_code).filter(c=>c&&c!=="--").join(","),i={results:e,productIds:ue,productShops:Ee,timestamp:Date.now()};localStorage.setItem("rankingResultsCache",JSON.stringify(i));let l=`
        ${r>0?`<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--warning-color); border-radius: var(--border-radius-sm); padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
               <span style="font-size: 1.25rem;"><i data-lucide="alert-triangle"></i></span>
               <span style="color: var(--warning-color); font-weight: 500;">有 ${r} 个商品疑似未上架</span>
               <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">可手动填写商品ID后点击保存</span>
               <button onclick="copyToClipboard('${o}')" style="margin-left: auto; padding: 0.25rem 0.75rem; font-size: 0.75rem; background: var(--warning-color); color: #fff; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">批量复制未匹配商品ID编码</button>
           </div>`:""}
        <div class="ranking-result-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <h3 style="margin: 0; font-size: 1rem;" class="flex-center gap-sm">📊 排品结果 <span class="db-table-tag">→ ranking_results</span></h3>
                <span style="font-size: 0.875rem; color: var(--text-secondary);">共 ${e.length} 个商品</span>
            </div>
            <button class="btn btn-sm" onclick="undoDeleteRankingItem()" style="font-size: 0.75rem; padding: 0.25rem 0.75rem;" ${$e.length===0?"disabled":""}>
                ↩ 撤回 (${$e.length})
            </button>
        </div>
    `;for(const[c,u]of Object.entries(t)){const p=u.map(m=>m.product_code).filter(m=>m&&m!=="--").join(","),g=u.map(m=>ue[m.product_name]).filter(m=>m).join(",");l+=`
            <div class="result-category">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0;">${c} <span class="count">(${u.length})</span></h4>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm js-copy-btn" data-copy="${p.replace(/"/g,"&quot;")}" onclick="window._copyFromBtn(this)" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;"><i data-lucide="clipboard-list"></i> 复制编码</button>
                        <button class="btn btn-sm js-copy-btn" data-copy="${g.replace(/"/g,"&quot;")}" onclick="window._copyFromBtn(this)" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;"><i data-lucide="clipboard-list"></i> 复制ID</button>
                    </div>
                </div>
                <div class="result-items-table">
                    <table class="ranking-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                        <thead>
                            <tr style="background: var(--bg-secondary); color: var(--text-secondary);">
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 80px;">图片</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 60px;">序号</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: left; width: 260px;">商品名称</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: left; width: 160px;">商品ID</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 80px;">店铺</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: left; width: 180px;">商品编码</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 70px;">可用数</th>
                                <th style="padding: 0.75rem 0.5rem; text-align: center; width: 50px;">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${u.map(m=>{const f=ue[m.product_name],L=Ee[m.product_name]||m.shop||"",d=!f,y=m.product_name.replace(/'/g,"\\'").replace(/"/g,'\\"'),b=(f||"").replace(/"/g,"&quot;"),_=f?`<span class="js-click-copy" data-copy="${b}" style="cursor:pointer; user-select:none;" title="点击复制ID">${f}</span>`:`<div style="display: flex; align-items: center; gap: 0.5rem;">
                       <input type="text" class="manual-product-id-input" data-product-name="${y}" 
                              placeholder="输入商品ID" 
                              style="width: 120px; padding: 0.25rem 0.5rem; font-size: 0.8rem; border: 1px solid var(--warning-color); border-radius: 4px; background: var(--bg-tertiary); color: var(--text-primary);">
                       <button onclick="saveManualProductId('${y}', this)" 
                               style="padding: 0.25rem 0.5rem; font-size: 0.7rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                           <i data-lucide="save"></i> 保存
                       </button>
                       <span style="color: var(--warning-color); font-size: 0.75rem;">疑似未上架</span>
                   </div>`,S=m.image_url||"",B=S?S.split(",")[0].trim():"",k=B?`<div class="hover-zoom-container">
                       <img src="${B}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>加载失败</span>'">
                   </div>`:'<div style="width: 48px; height: 48px; background: var(--bg-hover); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.625rem; border: 1px solid var(--border-color);">无图</div>',v=m.product_code||"--";let C="--";if(v!=="--"){const M=v.split(",").map($=>$.trim()).filter($=>$),P=M.join(","),h=P.replace(/"/g,"&quot;");if(M.length<=2)C=`<span class="js-click-copy" data-copy="${h}" style="cursor:pointer; user-select:none;" title="点击复制编码">${P}</span>`;else{const $=M.slice(0,2).join(","),A=M.length-2;C=`<span class="js-click-copy" data-copy="${h}" style="cursor:pointer; user-select:none;" title="点击复制全部编码（${P}）">${$}<span style="color: var(--primary-color); margin-left: 4px;">+${A}个</span></span>`}}const I=d?"border-bottom: 1px solid var(--border-color); background: rgba(239, 68, 68, 0.15);":"border-bottom: 1px solid var(--border-color);",D=m.available_qty!=null?m.available_qty:"--";return`
                                    <tr style="${I}">
                                        <td style="padding: 0.75rem 0.5rem; text-align: center;">${k}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: center; font-weight: 600; color: var(--primary-color); font-size: 1rem;">${m.sample_number}</td>
                                         <td class="js-click-copy" data-copy="${m.product_name.replace(/"/g,"&quot;")}" style="padding: 0.75rem 0.5rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; user-select: none;" title="点击复制">${m.product_name}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: left;">${_}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: center;">${St(L)}</td>
                                        <td style="padding: 0.75rem 0.5rem; color: var(--text-secondary); text-align: left;">${C}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: center; font-variant-numeric: tabular-nums; color: var(--text-secondary);">${D}</td>
                                        <td style="padding: 0.75rem 0.5rem; text-align: center;">
                                            <button class="btn-delete-item" onclick="removeRankingItem('${c}', '${m.product_name.replace(/'/g,"\\'")}')" title="从此分类删除" style="background: none; border: none; cursor: pointer; color: var(--error-color); font-size: 1rem; padding: 0.25rem;">✕</button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `}a.innerHTML=l||'<p class="placeholder">无排品结果</p>',window.lucide&&window.lucide.createIcons()}function $t(e){var a,t,n,r,o,i;if(!e){(t=(a=window.AppUtils)==null?void 0:a.showToast)==null||t.call(a,"没有可复制的内容","warning");return}try{const s=document.createElement("textarea");s.value=e,s.style.cssText="position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;",document.body.appendChild(s),s.focus(),s.select();const l=document.execCommand("copy");if(document.body.removeChild(s),l){(r=(n=window.AppUtils)==null?void 0:n.showToast)==null||r.call(n,"已复制到剪贴板","success");return}}catch{}navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(e).then(()=>{var s,l;return(l=(s=window.AppUtils)==null?void 0:s.showToast)==null?void 0:l.call(s,"已复制到剪贴板","success")}).catch(()=>{var s,l;return(l=(s=window.AppUtils)==null?void 0:s.showToast)==null?void 0:l.call(s,"复制失败，请手动复制","error")}):(i=(o=window.AppUtils)==null?void 0:o.showToast)==null||i.call(o,"复制失败，请手动复制","error")}document.addEventListener("click",function(e){const a=e.target.closest(".js-click-copy");if(!a)return;const t=a.dataset.copy||"";$t(t)});window._copyFromBtn=function(e){const a=e.closest?e.closest(".js-copy-btn"):e,t=a?a.dataset.copy:"";$t(t||"")};async function tt(){const e=document.getElementById("savedRankingResultContent");if(!e)return;const a=window.supabaseClient;if(!a){e.innerHTML='<p class="placeholder">数据库连接失败</p>';return}try{const{data:t,error:n}=await a.from("ranking_results").select("*").order("ranking_result",{ascending:!0}).order("sample_number",{ascending:!0});if(n)throw n;if(!t||t.length===0){e.innerHTML='<div class="placeholder-content"><p>暂无已保存的数据</p></div>';return}const r=await Et(),o=r.productIds||{},i=r.productShops||{},s={};t.forEach(c=>{s[c.ranking_result]||(s[c.ranking_result]=[]),s[c.ranking_result].push(c)});let l=`
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                共 ${t.length} 个商品
            </div>
        `;for(const[c,u]of Object.entries(s))l+=`
                <div class="result-category" style="margin-bottom: 1.5rem;">
                    <h4 style="margin: 0 0 0.5rem 0;">${c} <span class="count" style="font-size: 0.85rem; color: var(--text-muted);">(${u.length})</span></h4>
                    <div class="result-items-table">
                        <table class="ranking-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                            <thead>
                                <tr style="background: var(--bg-secondary); color: var(--text-secondary);">
                                    <th style="padding: 0.75rem 0.5rem; text-align: center; width: 80px;">图片</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: center; width: 60px;">序号</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: left; width: 250px;">商品名称</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: left; width: 200px;">商品ID</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: center; width: 80px;">店铺</th>
                                    <th style="padding: 0.75rem 0.5rem; text-align: left; width: 180px;">商品编码</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${u.map(p=>{const g=p.product_id||o[p.product_name],m=p.shop||i[p.product_name]||"",f=g||'<span style="color: var(--warning-color);">疑似未上架</span>',L=p.image_url||"",d=L?L.split(",")[0].trim():"",y=d?`<div class="hover-zoom-container">
                           <img src="${d}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>加载失败</span>'">
                       </div>`:'<div style="width: 48px; height: 48px; background: var(--bg-hover); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.625rem; border: 1px solid var(--border-color);">无图</div>',b=p.product_code||"--";return`
                                        <tr style="${!g?"border-bottom: 1px solid var(--border-color); background: rgba(239, 68, 68, 0.15);":"border-bottom: 1px solid var(--border-color);"}">
                                            <td style="padding: 0.75rem 0.5rem; text-align: center;">${y}</td>
                                            <td style="padding: 0.75rem 0.5rem; text-align: center; font-weight: 600; color: var(--primary-color); font-size: 1rem;">${p.sample_number||"--"}</td>
                                            <td style="padding: 0.75rem 0.5rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.product_name}">${p.product_name}</td>
                                            <td style="padding: 0.75rem 0.5rem; text-align: left;">${f}</td>
                                            <td style="padding: 0.75rem 0.5rem; text-align: center;">${St(m)}</td>
                                            <td style="padding: 0.75rem 0.5rem; color: var(--text-secondary); text-align: left;">${b}</td>
                                        </tr>
                                    `}).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;e.innerHTML=l}catch(t){console.error("读取已保存排品结果失败:",t),e.innerHTML=`<div class="placeholder-content"><p>读取失败: ${t.message}</p></div>`}}async function pn(){let e=await kt(),a=e.当前方案,t=oe(e,a);const n=document.getElementById("schemeSelector"),r=document.getElementById("btnNewScheme"),o=document.getElementById("btnCopyScheme"),i=document.getElementById("btnRenameScheme"),s=document.getElementById("btnDeleteScheme");function l(){if(!n)return;const h=Object.keys(e.方案列表);n.innerHTML=h.map($=>`<option value="${$}" ${$===a?"selected":""}>${$}</option>`).join("")}function c(h){a=h,e.当前方案=h,t=oe(e,h),d=null,y(),P(),g&&(g.innerHTML='<div class="placeholder-content" style="padding:2rem 0;"><p>请点击左侧分类以编辑筛选条件</p></div>'),m&&(m.textContent="筛选条件设置"),f&&(f.textContent="请从左侧选择一个分类进行配置")}l(),n&&n.addEventListener("change",h=>{c(h.target.value),ce(e)}),r&&r.addEventListener("click",()=>{var A,N,q,j;const h=prompt("请输入新方案名称：");if(!h||!h.trim())return;const $=h.trim();if(e.方案列表[$]){(N=(A=window.AppUtils)==null?void 0:A.showToast)==null||N.call(A,"方案名称已存在","error");return}e.方案列表[$]=JSON.parse(JSON.stringify(t)),a=$,e.当前方案=$,t=oe(e,$),l(),c($),ce(e),(j=(q=window.AppUtils)==null?void 0:q.showToast)==null||j.call(q,`已创建方案: ${$}`,"success")}),i&&i.addEventListener("click",()=>{var A,N,q,j;const h=prompt("请输入新名称：",a);if(!h||!h.trim()||h.trim()===a)return;const $=h.trim();if(e.方案列表[$]){(N=(A=window.AppUtils)==null?void 0:A.showToast)==null||N.call(A,"方案名称已存在","error");return}e.方案列表[$]=e.方案列表[a],delete e.方案列表[a],e.当前方案=$,a=$,t=oe(e,$),l(),ce(e),(j=(q=window.AppUtils)==null?void 0:q.showToast)==null||j.call(q,`已重命名为: ${$}`,"success")}),s&&s.addEventListener("click",()=>{var A,N,q,j;if(Object.keys(e.方案列表).length<=1){(N=(A=window.AppUtils)==null?void 0:A.showToast)==null||N.call(A,"至少需要保留一个方案","error");return}if(!confirm(`确定删除方案 "${a}" 吗？`))return;delete e.方案列表[a],a=Object.keys(e.方案列表)[0],e.当前方案=a,t=oe(e,a),l(),c(a),ce(e),(j=(q=window.AppUtils)==null?void 0:q.showToast)==null||j.call(q,"方案已删除","success")}),o&&o.addEventListener("click",()=>{var N,q;let h=`${a} (副本)`,$=h,A=2;for(;e.方案列表[$];)$=`${h} ${A}`,A++;e.方案列表[$]=JSON.parse(JSON.stringify(t)),a=$,e.当前方案=$,t=oe(e,$),l(),c($),ce(e),(q=(N=window.AppUtils)==null?void 0:N.showToast)==null||q.call(N,`已复制方案: ${$}`,"success")});let u=[];try{const h=window.supabaseClient;if(h){const{data:$,error:A}=await h.from("listing_category_mapping").select("source_category").not("source_category","is",null);!A&&$&&(u=[...new Set($.map(N=>N.source_category).filter(Boolean))].sort())}}catch(h){console.warn("加载商品分类失败:",h)}const p=document.getElementById("categoryOrderList"),g=document.getElementById("filterConditionsContainer"),m=document.getElementById("filterSettingsTitle"),f=document.getElementById("filterSettingsSubtitle"),L=document.getElementById("btnSaveSettings");let d=null;function y(){if(p){if(!t.分类排序||t.分类排序.length===0){p.innerHTML='<li class="placeholder">暂无分类，请添加</li>';return}p.innerHTML=t.分类排序.map((h,$)=>{const A=t.结果映射[h]||h,N=h===d;return`
                <li class="sortable-item ${N?"active":""}" data-category="${h}" data-index="${$}" style="cursor:pointer; padding:0.75rem; border:1px solid; border-radius:var(--border-radius-sm); margin-bottom:0.5rem; display:flex; align-items:center; justify-content:space-between; transition:all 0.15s ease; ${N?"background:var(--primary-color); color:white; border-color:var(--primary-color);":"background:var(--bg-tertiary); border-color:transparent;"}">
                    <span class="category-name" style="font-weight:500;">${$+1}. ${A}</span>
                    <div class="category-actions" style="display:flex; gap:0.25rem;">
                         <button class="btn-icon btn-move-up" data-index="${$}" title="上移" style="font-size:0.8rem; color:${N?"rgba(255,255,255,0.8)":"var(--text-muted)"}; opacity:0.7;">↑</button>
                         <button class="btn-icon btn-move-down" data-index="${$}" title="下移" style="font-size:0.8rem; color:${N?"rgba(255,255,255,0.8)":"var(--text-muted)"}; opacity:0.7;">↓</button>
                        <button class="btn-icon btn-delete" data-category="${h}" title="删除" style="font-size:0.8rem; color:${N?"rgba(255,255,255,0.8)":"var(--text-muted)"}; opacity:0.7; margin-left:0.5rem;">✕</button>
                    </div>
                </li>
            `}).join(""),p.querySelectorAll(".sortable-item").forEach(h=>{h.addEventListener("click",$=>{if($.target.closest(".category-actions"))return;const A=h.dataset.category;d=A,y(),_(A)})}),p.querySelectorAll(".btn-move-up").forEach(h=>{h.addEventListener("click",$=>{$.stopPropagation();const A=parseInt(h.dataset.index);if(A>0){const N=t.分类排序[A];t.分类排序[A]=t.分类排序[A-1],t.分类排序[A-1]=N,y(),S()}})}),p.querySelectorAll(".btn-move-down").forEach(h=>{h.addEventListener("click",$=>{$.stopPropagation();const A=parseInt(h.dataset.index);if(A<t.分类排序.length-1){const N=t.分类排序[A];t.分类排序[A]=t.分类排序[A+1],t.分类排序[A+1]=N,y(),S()}})}),p.querySelectorAll(".btn-delete").forEach(h=>{h.addEventListener("click",$=>{$.stopPropagation();const A=h.dataset.category,N=t.结果映射[A]||A;confirm(`确定删除分类"${N}"吗？`)&&(t.分类排序=t.分类排序.filter(q=>q!==A),delete t.结果映射[A],delete t.筛选条件[A],t.样品序号规则&&t.样品序号规则[N]&&delete t.样品序号规则[N],d===A&&(d=null,_(null)),y(),S())})})}}let b=null;function _(h){if(!g)return;b&&b.abort(),b=new AbortController;const $=b.signal;if(!h){m&&(m.textContent="筛选条件设置"),f&&(f.textContent="请从左侧选择一个分类进行配置"),g.innerHTML='<div class="placeholder-content" style="padding:2rem 0;"><p>请点击左侧分类以编辑筛选条件</p></div>';return}const A=t.结果映射[h]||h;m&&(m.textContent=`${A} - 筛选规则`),f&&(f.textContent=`配置 ${A} 的筛选逻辑`),t.筛选条件||(t.筛选条件={}),t.筛选条件[h]||(t.筛选条件[h]={});function N(w){return["实际库存数","评分排名","可用数"].includes(w)?"numeric":w==="是否可佩戴"?"boolean":"string"}function q(w){return w==="numeric"?`
                    <option value="大于等于">大于等于</option>
                    <option value="小于等于">小于等于</option>
                    <option value="等于">等于</option>
                    <option value="前几名">前几名</option>
                    <option value="后几名">后几名（分越大越靠前）</option>
                `:w==="boolean"?'<option value="排除">排除</option>':`
                    <option value="包含">包含</option>
                    <option value="等于">等于</option>
                `}const j=t.筛选条件[h].按子分类分别筛选===!0,K=t.筛选条件[h].子分类字段||"商品分类",J=t.筛选条件[h].选中子分类||[],Q=u.map(w=>`
            <label style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;" 
                   onmouseover="this.style.background='var(--bg-secondary)'" 
                   onmouseout="this.style.background='transparent'">
                <input type="checkbox" class="subcategory-checkbox" value="${w}" ${J.includes(w)?"checked":""}>
                <span style="font-size:0.85rem;">${w}</span>
            </label>
        `).join("");g.innerHTML=`
            <div class="settings-group" style="margin-bottom:1.5rem;">
                <label style="font-weight:500; margin-bottom:0.5rem; display:block;">显示名称</label>
                <input type="text" class="input settings-input" id="inputDisplayName" value="${A}">
            </div>
            
            <div style="border-top:1px solid var(--border-color); margin:1.5rem 0;"></div>

            <!-- 按子分类分别筛选 -->
            <div class="settings-group" style="margin-bottom:1.5rem; padding:1rem; background:var(--bg-tertiary); border-radius:var(--border-radius); border:1px solid var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                    <div>
                        <label style="font-weight:500; display:block;">按子分类分别筛选</label>
                        <span style="font-size:0.8rem; color:var(--text-muted);">每个子分类取可用数最大的1个</span>
                    </div>
                    <label class="switch" style="position:relative; display:inline-block; width:50px; height:26px;">
                        <input type="checkbox" id="toggleSubcategoryFilter" ${j?"checked":""} style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:${j?"var(--primary-color)":"var(--bg-secondary)"}; border-radius:26px; transition:0.3s; border:1px solid var(--border-color);">
                            <span style="position:absolute; content:''; height:20px; width:20px; left:${j?"26px":"2px"}; bottom:2px; background:white; border-radius:50%; transition:0.3s;"></span>
                        </span>
                    </label>
                </div>
                <div id="subcategoryFieldContainer" style="display:${j?"flex":"none"}; gap:1rem; margin-top:0.75rem;">
                    <!-- 左侧：子分类字段 -->
                    <div style="flex:1;">
                        <label style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem; display:block;">子分类字段</label>
                        <select id="selectSubcategoryField" class="input" style="width:100%;">
                            ${le.filter(w=>N(w)==="string").map(w=>`<option value="${w}" ${w===K?"selected":""}>${w}</option>`).join("")}
                        </select>
                    </div>
                    <!-- 右侧：选择要提取的分类 -->
                    <div style="flex:2;">
                        <label style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem; display:block;">选择要提取的分类 <span style="color:var(--primary-color);">(已选 ${J.length} 项)</span></label>
                        <div class="subcategory-selector" style="position:relative;">
                            <div class="subcategory-toggle" style="padding:0.5rem; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:var(--text-muted); font-size:0.85rem;">${J.length>0?J.slice(0,3).join(", ")+(J.length>3?"...":""):"点击选择分类"}</span>
                                <span style="font-size:0.7rem;">▼</span>
                            </div>
                            <div class="subcategory-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:200px; overflow-y:auto; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:100; margin-top:4px; padding:0.5rem;">
                                ${Q||'<span style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem;">暂无分类数据</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h4 style="margin:0;">筛选规则列表</h4>
                <button class="btn btn-primary" id="btnAddRule" style="padding:0.4rem 1rem;">+ 添加规则</button>
            </div>

            <div id="rulesListContainer" style="display:flex; flex-direction:column; gap:1rem;">
                <!-- 规则卡片将动态插入这里 -->
            </div>
        `;const ae=g.querySelector("#rulesListContainer");function O(w,E,T){const R=N(w.field||le[0]),H=q(R),U=w.field||le[0];let z;if(U==="商品分类"&&u.length>0){const F=Array.isArray(w.value)?w.value:w.value?[w.value]:[],W=u.map(Z=>`
                    <label style="display:flex; align-items:center; gap:0.5rem; padding:0.25rem 0.5rem; cursor:pointer; border-radius:4px;" 
                           onmouseover="this.style.background='var(--bg-tertiary)'" 
                           onmouseout="this.style.background='transparent'">
                        <input type="checkbox" class="category-checkbox" value="${Z}" ${F.includes(Z)?"checked":""}>
                        <span style="font-size:0.85rem;">${Z}</span>
                    </label>
                `).join("");z=`
                    <div class="category-selector" style="flex:2; min-width:180px; position:relative;">
                        <div class="category-toggle" style="padding:0.5rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                            <span class="selected-count" style="color:var(--text-muted); font-size:0.85rem;">已选 ${F.length} 项</span>
                            <span style="font-size:0.7rem;">▼</span>
                        </div>
                        <div class="category-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; max-height:200px; overflow-y:auto; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--border-radius-sm); box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:100; margin-top:4px;">
                            ${W}
                        </div>
                    </div>
                `}else z=`<input type="text" class="input condition-value" style="flex:1; min-width:80px;" value="${Array.isArray(w.value)?w.value.join(","):w.value||""}" placeholder="值">`;return`
                <div class="condition-row" data-rule-index="${T}" data-cond-index="${E}" style="display:flex; gap:0.5rem; align-items:flex-start; padding:0.75rem; background:var(--bg-tertiary); border-radius:var(--border-radius-sm); margin-bottom:0.5rem;">
                    <select class="input condition-field" style="flex:1; min-width:100px;">
                        ${le.map(F=>`<option value="${F}" ${w.field===F?"selected":""}>${F}</option>`).join("")}
                    </select>
                    <select class="input condition-operator" style="flex:1; min-width:80px;">
                        ${H.replace(`value="${w.operator}"`,`value="${w.operator}" selected`)}
                    </select>
                    ${z}
                    <button class="btn-icon btn-delete-condition" title="删除条件" style="color:var(--error-color); font-size:1.2rem; cursor:pointer; padding:0.25rem;">×</button>
                </div>
            `}function V(w){const E=t.筛选条件[h],T=["按子分类分别筛选","子分类字段","选中子分类"],R=Object.keys(E).filter(W=>!T.includes(W))[w];if(!R)return"";const H=E[R];let U=[];H.conditions&&Array.isArray(H.conditions)?U=H.conditions:(["大于等于","小于等于","等于","前几名","后几名","包含","排除"].forEach(Z=>{H[Z]!==void 0&&U.push({field:R,operator:Z,value:H[Z]})}),U.length===0&&U.push({field:R,operator:N(R)==="numeric"?"大于等于":"包含",value:""}));const z=U.map((W,Z)=>(Z>0?'<div style="text-align:center; color:var(--primary-color); font-weight:bold; margin:0.25rem 0;">且</div>':"")+O(W,Z,w)).join(""),F=H.启用!==!1;return`
                <div class="rule-card" data-rule-key="${R}" data-rule-index="${w}" style="background:var(--bg-secondary); padding:1rem; border-radius:var(--border-radius); border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                        <strong style="color:var(--primary-color);">规则 ${w+1}</strong>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <label style="display:flex; align-items:center; gap:0.3rem; font-size:0.85rem; cursor:pointer;">
                                <input type="checkbox" class="rule-enable" ${F?"checked":""}>
                                <span>启用</span>
                            </label>
                            <button class="btn-icon btn-add-condition" title="添加条件(且)" style="color:var(--primary-color); font-size:0.85rem; cursor:pointer; padding:0.25rem 0.5rem; border:1px solid var(--primary-color); border-radius:4px;">+ 且</button>
                            <button class="btn-icon btn-delete-rule" title="删除规则" style="color:var(--error-color); font-size:1.2rem; cursor:pointer; padding:0.25rem;">×</button>
                        </div>
                    </div>
                    <div class="conditions-container">
                        ${z}
                    </div>
                </div>
            `}function x(){const w=t.筛选条件[h],E=Object.keys(w).filter(T=>T!=="按子分类分别筛选"&&T!=="子分类字段");E.length===0?ae.innerHTML='<div style="padding:2rem; text-align:center; color:var(--text-muted);">暂无筛选规则，点击上方"添加规则"开始配置</div>':ae.innerHTML=E.map((T,R)=>V(R)).join("")}x(),g.addEventListener("click",w=>{const E=w.target;if(E.id==="btnAddRule"||E.closest("#btnAddRule")){w.preventDefault();const T=`rule_${Date.now()}`;t.筛选条件[h][T]={conditions:[{field:le[0],operator:"包含",value:""}],启用:!0},x(),S();return}if(E.classList.contains("btn-delete-rule")||E.closest(".btn-delete-rule")){const T=E.closest(".rule-card");if(T&&confirm("确定删除此规则？")){const R=T.dataset.ruleKey;delete t.筛选条件[h][R],x(),S()}return}if(E.classList.contains("btn-add-condition")||E.closest(".btn-add-condition")){const T=E.closest(".rule-card");if(T){const R=T.dataset.ruleKey,H=t.筛选条件[h][R];H.conditions||(H.conditions=[]),H.conditions.push({field:le[0],operator:"包含",value:""}),x(),S()}return}if(E.classList.contains("btn-delete-condition")||E.closest(".btn-delete-condition")){const T=E.closest(".condition-row"),R=E.closest(".rule-card");if(T&&R){const H=R.dataset.ruleKey,U=parseInt(T.dataset.condIndex),z=t.筛选条件[h][H];z.conditions&&z.conditions.length>1?(z.conditions.splice(U,1),x(),S()):alert("至少需要保留一个条件")}return}if(E.closest(".category-toggle")){const T=E.closest(".category-selector");if(T){const R=T.querySelector(".category-dropdown");if(R){const H=R.style.display!=="none";g.querySelectorAll(".category-dropdown, .subcategory-dropdown").forEach(U=>U.style.display="none"),R.style.display=H?"none":"block"}}return}if(E.closest(".subcategory-toggle")){const T=E.closest(".subcategory-selector");if(T){const R=T.querySelector(".subcategory-dropdown");if(R){const H=R.style.display!=="none";g.querySelectorAll(".category-dropdown, .subcategory-dropdown").forEach(U=>U.style.display="none"),R.style.display=H?"none":"block"}}return}!E.closest(".category-selector")&&!E.closest(".subcategory-selector")&&g.querySelectorAll(".category-dropdown, .subcategory-dropdown").forEach(T=>T.style.display="none")},{signal:$}),g.addEventListener("change",w=>{const E=w.target;if(E.id==="inputDisplayName"){const R=E.value.trim();if(R){const H=t.结果映射[h];H&&H!==R&&t.样品序号规则&&t.样品序号规则[H]&&(t.样品序号规则[R]=t.样品序号规则[H],delete t.样品序号规则[H]),t.结果映射[h]=R,y(),S()}return}if(E.id==="toggleSubcategoryFilter"){t.筛选条件[h].按子分类分别筛选=E.checked,_(h),S();return}if(E.id==="selectSubcategoryField"){t.筛选条件[h].子分类字段=E.value,S();return}if(E.classList.contains("subcategory-checkbox")){const R=E.closest(".subcategory-selector");if(R){const H=R.querySelectorAll(".subcategory-checkbox:checked"),U=Array.from(H).map(W=>W.value);t.筛选条件[h].选中子分类=U;const z=g.querySelector("#subcategoryFieldContainer label span");z&&(z.textContent=`(已选 ${U.length} 项)`);const F=R.querySelector(".subcategory-toggle span:first-child");F&&(F.textContent=U.length>0?U.slice(0,3).join(", ")+(U.length>3?"...":""):"点击选择分类"),S()}return}if(E.classList.contains("rule-enable")){const R=E.closest(".rule-card");if(R){const H=R.dataset.ruleKey;t.筛选条件[h][H].启用=E.checked,S()}return}const T=E.closest(".condition-row");if(T){const R=E.closest(".rule-card");if(R){const H=R.dataset.ruleKey,U=parseInt(T.dataset.condIndex),z=t.筛选条件[h][H];if(z.conditions||(z.conditions=[]),z.conditions[U]||(z.conditions[U]={}),E.classList.contains("condition-field")){z.conditions[U].field=E.value;const F=N(E.value);let W="包含";F==="numeric"?W="大于等于":F==="boolean"&&(W="排除"),z.conditions[U].operator=W,x()}else if(E.classList.contains("condition-operator"))z.conditions[U].operator=E.value;else if(E.classList.contains("condition-value")){let F=E.value;F.includes(",")||F.includes("，")?F=F.split(/[,，]/).map(W=>W.trim()).filter(W=>W):!isNaN(parseFloat(F))&&isFinite(F)&&(F=parseFloat(F)),z.conditions[U].value=F}else if(E.classList.contains("condition-value-multi")){const F=Array.from(E.selectedOptions).map(W=>W.value);z.conditions[U].value=F}else if(E.classList.contains("category-checkbox")){const F=E.closest(".category-selector");if(F){const W=F.querySelectorAll(".category-checkbox:checked"),Z=Array.from(W).map(Lt=>Lt.value);z.conditions[U].value=Z;const se=F.querySelector(".selected-count");se&&(se.textContent=`已选 ${Z.length} 项`)}}S()}}},{signal:$})}async function S(){e.方案列表[a]=t,await ce(e)}y();const B=document.getElementById("newCategoryInput"),k=document.getElementById("btnAddCategory"),v=document.getElementById("btnConfirmAddCategory"),C=document.getElementById("btnCancelAddCategory"),I=document.getElementById("addCategoryContainer");k&&k.addEventListener("click",()=>{I&&(I.style.display="block"),B&&B.focus()}),C&&C.addEventListener("click",()=>{I&&(I.style.display="none"),B&&(B.value="")}),v&&v.addEventListener("click",()=>{const h=B.value.trim();if(!h)return;const $=`自定义${Date.now()}`;t.分类排序.push($),t.结果映射[$]=h,t.筛选条件[$]={},t.样品序号规则||(t.样品序号规则={}),t.样品序号规则[h]={prefix:"X",start:1,step:1},B.value="",I&&(I.style.display="none"),y(),P(),S()}),L&&L.addEventListener("click",async()=>{var h,$,A,N;L.disabled=!0,L.textContent="保存中...";try{await S(),($=(h=window.AppUtils)==null?void 0:h.showToast)==null||$.call(h,"设置已保存","success")}catch(q){(N=(A=window.AppUtils)==null?void 0:A.showToast)==null||N.call(A,q.message,"error")}finally{L.disabled=!1,L.textContent="保存设置"}});const D=document.getElementById("sampleRulesContainer"),M=document.getElementById("btnSaveAssignment");t.样品序号规则||(t.样品序号规则={});function P(){if(!D)return;const h=t.分类排序||[];h.length===0?D.innerHTML='<p class="text-muted">请先在上方添加分类</p>':(D.innerHTML=h.map(($,A)=>{const N=t.结果映射[$]||$;let q=t.样品序号规则[N]||{prefix:"",start:1,step:1};return t.样品序号规则[N]||(t.样品序号规则[N]=q),`
                    <div class="rules-card" style="background:var(--bg-tertiary); padding:1rem; border-radius:var(--border-radius-sm); border-left: 3px solid var(--primary-color);">
                        <div style="display:flex; gap:1rem; margin-bottom:0.5rem; align-items:center;">
                            <strong>${A+1}. ${N}</strong>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">前缀</label>
                                <input type="text" class="input input-sm rule-input-assignment" data-cat="${N}" data-field="prefix" value="${q.prefix||""}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">起始号</label>
                                <input type="number" class="input input-sm rule-input-assignment" data-cat="${N}" data-field="start" value="${q.start||1}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">步长</label>
                                <input type="number" class="input input-sm rule-input-assignment" data-cat="${N}" data-field="step" value="${q.step||1}">
                            </div>
                        </div>
                    </div>
                `}).join(""),D.querySelectorAll(".rule-input-assignment").forEach($=>{$.addEventListener("change",A=>{const N=A.target.dataset.cat,q=A.target.dataset.field,j=A.target.value;t.样品序号规则[N]||(t.样品序号规则[N]={}),q==="start"||q==="step"?t.样品序号规则[N][q]=parseInt(j)||1:t.样品序号规则[N][q]=j})}))}P(),M&&M.addEventListener("click",async()=>{var h,$;M.disabled=!0,M.textContent="保存中...",await S(),($=(h=window.AppUtils)==null?void 0:h.showToast)==null||$.call(h,"规则已保存","success"),M.disabled=!1,M.textContent="保存规则"})}async function mn(){let e=await _t();const a=document.getElementById("sampleRulesContainer"),t=document.getElementById("newProductRulesContainer"),n=document.getElementById("btnSaveAssignment");e.样品序号规则||(e.样品序号规则={}),e.新品序号规则||(e.新品序号规则={prefix:"N",start:1,step:1});function r(){if(!a)return;const o=e.分类排序||[];if(o.length===0?a.innerHTML='<p class="text-muted">请先在【排品设置】中添加分类</p>':(a.innerHTML=o.map((i,s)=>{const l=e.结果映射[i]||i;let c=e.样品序号规则[l]||{prefix:"",start:1,step:1};return e.样品序号规则[l]||(e.样品序号规则[l]=c),`
                    <div class="rules-card" style="background:var(--bg-tertiary); padding:1rem; border-radius:var(--border-radius-sm); border-left: 3px solid var(--primary-color);">
                        <div style="display:flex; gap:1rem; margin-bottom:0.5rem; align-items:center;">
                            <strong>${s+1}. ${l}</strong>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.5rem;">
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">前缀</label>
                                <input type="text" class="input input-sm rule-input" data-cat="${l}" data-field="prefix" value="${c.prefix||""}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">起始号</label>
                                <input type="number" class="input input-sm rule-input" data-cat="${l}" data-field="start" value="${c.start||1}">
                            </div>
                            <div class="input-group-vertical">
                                <label style="font-size:0.8rem; color:var(--text-muted);">步长</label>
                                <input type="number" class="input input-sm rule-input" data-cat="${l}" data-field="step" value="${c.step||1}">
                            </div>
                        </div>
                    </div>
                `}).join(""),a.querySelectorAll(".rule-input").forEach(i=>{i.addEventListener("change",s=>{const l=s.target.dataset.cat,c=s.target.dataset.field,u=s.target.value;e.样品序号规则[l]||(e.样品序号规则[l]={}),c==="start"||c==="step"?e.样品序号规则[l][c]=parseInt(u)||1:e.样品序号规则[l][c]=u})})),t){const i=e.新品序号规则;t.querySelectorAll(".new-rule-input").forEach(l=>{const c=l.dataset.field;c==="prefix"&&(l.value=i.prefix||""),c==="start"&&(l.value=i.start||1),c==="step"&&(l.value=i.step||1)})}}r(),t&&t.querySelectorAll(".new-rule-input").forEach(o=>{o.addEventListener("change",i=>{const s=i.target.dataset.field,l=i.target.value;s==="start"||s==="step"?e.新品序号规则[s]=parseInt(l)||1:e.新品序号规则[s]=l})}),n&&n.addEventListener("click",async()=>{var o,i;n.disabled=!0,n.textContent="保存中...",await Se("filter_config",e),(i=(o=window.AppUtils)==null?void 0:o.showToast)==null||i.call(o,"规则已保存","success"),n.disabled=!1,n.textContent="保存规则"})}async function gn(){const e=document.getElementById("excludedListBody"),a=document.getElementById("excludeInput"),t=document.getElementById("btnAddExclude");async function n(){const l=await xt();e&&(l.length===0?e.innerHTML='<tr><td colspan="2" class="text-center" style="padding:2rem; color:var(--text-muted);">暂无排除商品</td></tr>':(e.innerHTML=l.map(c=>`
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.75rem 1rem;">${c.product_name}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon btn-delete-exclude" data-name="${c.product_name}" title="删除" style="color:var(--error-color);">✕</button>
                    </td>
                </tr>
            `).join(""),e.querySelectorAll(".btn-delete-exclude").forEach(c=>{c.addEventListener("click",async()=>{const u=c.dataset.name;if(confirm(`移除 "${u}"？`))try{await Fa(u),n()}catch(p){console.error(p)}})})))}t&&(t.addEventListener("click",async()=>{var c,u,p,g;const l=a.value.trim();if(l)try{await ja(l),a.value="",n(),(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"已添加","success")}catch(m){(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,m.message,"error")}}),a.addEventListener("keypress",l=>{l.key==="Enter"&&t.click()}));const r=document.getElementById("excludedNonWearableListBody"),o=document.getElementById("excludeNonWearableInput"),i=document.getElementById("btnAddNonWearable");async function s(){const l=await Oa();r&&(l.length===0?r.innerHTML='<tr><td colspan="2" class="text-center" style="padding:2rem; color:var(--text-muted);">暂无记录</td></tr>':(r.innerHTML=l.map(c=>`
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.75rem 1rem;">${c.product_name}</td>
                    <td style="text-align:center;">
                        <button class="btn-icon btn-delete-nw" data-name="${c.product_name}" title="删除" style="color:var(--error-color);">✕</button>
                    </td>
                </tr>
            `).join(""),r.querySelectorAll(".btn-delete-nw").forEach(c=>{c.addEventListener("click",async()=>{var p,g;const u=c.dataset.name;if(confirm(`移除 "${u}"？`))try{await Ka(u),s()}catch(m){(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,m.message,"error")}})})))}i&&(i.addEventListener("click",async()=>{var c,u,p,g;const l=o.value.trim();if(l)try{await Wa(l),o.value="",s(),(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"已添加","success")}catch(m){(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,m.message,"error")}}),o.addEventListener("keypress",l=>{l.key==="Enter"&&i.click()})),n(),s()}window.loadRankingPage=function(e){return e==="ranking"||e==="ranking-calculate"?{html:tn(),init:dn}:e==="ranking-settings"?{html:an(),init:pn}:e==="ranking-assignment"?{html:nn(),init:mn}:e==="ranking-exclusion"?{html:rn(),init:gn}:e==="ranking-check"?{html:on(),init:sn}:e==="ranking-scoring"?{html:Na(),init:qa}:null};function fn(){return{html:vn(),init:yn}}window.loadWelfareRankingPage=fn;function vn(){return`
        <div class="page-content" style="padding: 0;">
            <div class="page-intro flex-between" style="align-items: flex-start;">
                <div>
                    <h2><i data-lucide="gift"></i> 福利排品 <span class="db-table-tag">→ welfare_arranged_data</span></h2>
                    <p>从此列表勾选要参与排品的福利商品，点击保存后将替换之前的选择。</p>
                </div>
                <div class="header-buttons flex-center" style="gap:0.75rem;">
                    <button class="btn btn-danger" id="btnClearWelfareData" title="清空已保存的排品名单">🗑️ 清空</button>
                    <button class="btn btn-secondary" id="btnRefreshWelfareRanking" title="刷新表格数据"><i data-lucide="refresh-cw"></i> 刷新</button>
                    <button class="btn btn-primary" id="btnSaveWelfareRanking" disabled><i data-lucide="save"></i> 保存选中的商品</button>
                </div>
            </div>

            <div class="welfare-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">
                                <input type="checkbox" id="welfareSelectAll" title="全选">
                            </th>
                            <th style="width: 80px;">图片</th>
                            <th>商品名</th>
                            <th>商品编码</th>
                            <th>数据来源</th>
                            <th style="text-align: right;">可用条数</th>
                        </tr>
                    </thead>
                    <tbody id="welfareRankingTbody">
                        <tr><td colspan="6" class="text-center text-muted" style="padding: 3rem;">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `}async function yn(){const e=document.getElementById("welfareRankingTbody"),a=document.getElementById("btnSaveWelfareRanking"),t=document.getElementById("welfareSelectAll"),n=document.getElementById("btnRefreshWelfareRanking"),r=document.getElementById("btnClearWelfareData");let o=[],i=!1;async function s(){try{AppUtils.showLoading("加载福利商品中...");const{data:p,error:g}=await window.supabaseClient.from("welfare_inventory_data").select("*").order("available_qty",{ascending:!1});if(g)throw g;o=(p||[]).filter(f=>f.available_qty===null||f.available_qty>0).map(f=>({...f,__source:"福利品"})),l(),u()}catch(p){console.error("加载福利数据失败:",p),AppUtils.showToast("加载失败: "+p.message,"error"),e.innerHTML='<tr><td colspan="6" class="text-center text-error">加载失败</td></tr>'}finally{AppUtils.hideLoading()}}function l(){if(o.length===0){e.innerHTML='<tr><td colspan="6" class="text-center text-muted" style="padding: 3rem;">暂无福利商品数据</td></tr>';return}e.innerHTML=o.map((g,m)=>{const f=typeof g.available_qty=="number"?g.available_qty:"-",L=g.__source==="福利品"?"source-tag-welfare":"source-tag-other";return`
                <tr class="welfare-row">
                    <td style="text-align: center;">
                        <input type="checkbox" class="welfare-checkbox" data-idx="${m}">
                    </td>
                    <td>
                        <div class="thumb-wrapper">
                            ${g.image_url?`<img src="${g.image_url}" class="product-thumb" loading="lazy" referrerpolicy="no-referrer" alt="图">`:'<span class="no-thumb">无</span>'}
                        </div>
                    </td>
                    <td title="${g.product_name||g.original_name}">${g.product_name||g.original_name||"-"}</td>
                    <td>${g.product_code||"-"}</td>
                    <td><span class="source-tag ${L}">${g.__source}</span></td>
                    <td style="text-align: right; font-weight: bold;">${f}</td>
                </tr>
            `}).join(""),document.querySelectorAll(".welfare-checkbox").forEach(g=>{g.addEventListener("change",()=>{c(),u()})})}t.addEventListener("change",p=>{const g=p.target.checked;document.querySelectorAll(".welfare-checkbox").forEach(f=>f.checked=g),u()});function c(){const p=document.querySelectorAll(".welfare-checkbox");if(p.length===0)return;const g=Array.from(p).every(f=>f.checked),m=Array.from(p).some(f=>f.checked);t.checked=g,t.indeterminate=m&&!g}function u(){const p=document.querySelectorAll(".welfare-checkbox:checked");a.disabled=i||p.length===0}n.addEventListener("click",()=>{s()}),r.addEventListener("click",async()=>{if(confirm("确定要清空已经保存到 welfare_arranged_data 里的所有福利排品数据吗？此操作无法恢复。"))try{AppUtils.showLoading("正在清空数据...");const{error:p}=await window.supabaseClient.from("welfare_arranged_data").delete().gte("id",0);if(p)throw p;AppUtils.showToast("福利排品数据已清空","success")}catch(p){console.error("清空失败:",p),AppUtils.showToast("清空失败: "+p.message,"error")}finally{AppUtils.hideLoading()}}),a.addEventListener("click",async()=>{if(i)return;const p=Array.from(document.querySelectorAll(".welfare-checkbox:checked"));if(p.length===0)return;const g=p.map(m=>o[m.dataset.idx]);try{i=!0,a.disabled=!0,AppUtils.showLoading("正在保存选中的商品...");const{error:m}=await window.supabaseClient.from("welfare_arranged_data").delete().gte("id",0);if(m)throw m;const f=g.map(d=>({source:d.__source,product_name:d.product_name||d.original_name,image_url:d.image_url,product_code:d.product_code,available_qty:typeof d.available_qty=="number"?d.available_qty:null})),L=100;for(let d=0;d<f.length;d+=L){const y=f.slice(d,d+L),{error:b}=await window.supabaseClient.from("welfare_arranged_data").insert(y);if(b)throw b}AppUtils.showCenterAlert(`成功保存了 ${g.length} 款福利商品。`,'<i data-lucide="check-circle"></i>'),document.querySelectorAll(".welfare-checkbox").forEach(d=>d.checked=!1),t.checked=!1,t.indeterminate=!1,u()}catch(m){console.error("保存报错:",m),AppUtils.showToast("保存失败: "+m.message,"error")}finally{i=!1,u(),AppUtils.hideLoading()}}),s()}async function Ct(){var n,r;console.log("⚙️ [对照配置] 正在加载仓位映射规则...");const e=window.supabaseClient;if(!e)return null;const{data:a,error:t}=await e.from("mapping_config").select("*").eq("config_key","warehouse_rules").single();return t?(console.warn('<i data-lucide="alert-triangle"></i> [对照配置] 加载失败, 使用默认配置:',t.message),{rules:[]}):(console.log(`<i data-lucide="check-circle"></i> [对照配置] 加载成功, 规则数: ${((r=(n=a==null?void 0:a.config_value)==null?void 0:n.rules)==null?void 0:r.length)||0}`),(a==null?void 0:a.config_value)||{rules:[]})}async function at(e){console.log('<i data-lucide="save"></i> [对照配置] 正在保存仓位映射规则...');const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");const{error:t}=await a.from("mapping_config").upsert({config_key:"warehouse_rules",config_value:e,updated_at:new Date().toISOString()},{onConflict:"config_key"});if(t)throw console.error('<i data-lucide="x-circle"></i> [对照配置] 保存失败:',t.message),new Error("保存配置失败: "+t.message);console.log('<i data-lucide="check-circle"></i> [对照配置] 保存成功')}function Ie(e){const a=String(e??"").trim();return["1","2","3","4","5"].includes(a)?a:""}function Re(e,a){const t=new Set(String(e||"").split(",").map(Ie).filter(Boolean)),n=Ie(a);return n&&t.add(n),Array.from(t).sort((r,o)=>Number(r)-Number(o)).join(",")}function bn(e){const a=String(e||"").split(",").map(Ie).filter(Boolean);return a.length===0?'<span style="color: var(--text-muted);">--</span>':a.map(t=>`<span class="shop-badge" data-shop="${t}">${t}号</span>`).join("")}async function hn(){const e=window.supabaseClient;if(!e)return{};let a=[],t=0;const n=1e3;let r=!0;for(;r;){const{data:i,error:s}=await e.from("product_id_data").select("*").range(t*n,(t+1)*n-1);if(s)return console.warn("加载商品店铺映射失败:",s.message),{};i&&i.length>0?(a=a.concat(i),i.length<n?r=!1:t++):r=!1}const o={};return a.forEach(i=>{const s=String(i.product_id??"").trim();if(!s)return;const l=Ie(i.shop??i.店铺);l&&(o[s]=Re(o[s],l))}),o}function wn(e,a){return!e||!a||a.length===0?e:e.split(",").map(r=>r.trim()).map(r=>xn(r,a)).join(",")}function xn(e,a){const t=e.split("-");if(t.length!==3)return e;const[n,r,o]=t,i=parseInt(r);if(isNaN(i))return e;for(const s of a)if(i>=s.range_start&&i<=s.range_end)return`${s.sample_value}-${o}`;return e}async function _n(e=!0){console.log(`📥 [对照数据] 开始加载排品结果${e?"和新品数据":"（不含新品）"}...`);const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");const t=await a.from("ranking_results").select("*");if(t.error)throw new Error("加载排品结果失败: "+t.error.message);const n=t.data||[];let r=[];if(e){const i=await a.from("new_product_data").select("*");if(i.error)throw new Error("加载新品数据失败: "+i.error.message);r=i.data||[]}console.log(`📊 [对照数据] ranking_results: ${n.length} 条${e?", new_product_data: "+r.length+" 条":""}`);const o=kn(n,r);return o._sourceStats={rankingCount:n.length,newProductCount:r.length,includeNew:e},console.log(`<i data-lucide="check-circle"></i> [对照数据] 合并完成, 共 ${o.length} 个商品`),o}function kn(e,a){const t=new Map,n=(o,i)=>{if(!i)return o||"";if(!o)return i;const s=new Set(o.split(",").map(l=>l.trim()).filter(Boolean));return i.split(",").map(l=>l.trim()).filter(Boolean).forEach(l=>s.add(l)),Array.from(s).join(",")};e.forEach(o=>{const i=o.product_name;if(i)if(t.has(i)){const s=t.get(i);s.warehouse=n(s.warehouse,o.warehouse),s.shop=Re(s.shop,o.shop),s.available_qty=(s.available_qty||0)+(o.available_qty||0),s.actual_stock=(s.actual_stock||0)+(o.actual_stock||0),!s.image_url&&o.image_url&&(s.image_url=o.image_url)}else t.set(i,{product_name:i,product_id:o.product_id||"",shop:o.shop||"",ranking_result:o.ranking_result||"",sample_number:o.sample_number||"",image_url:o.image_url||"",warehouse:o.warehouse||"",available_qty:o.available_qty||0,actual_stock:o.actual_stock||0})}),a.forEach(o=>{const i=o.product_name;if(i)if(t.has(i)){const s=t.get(i);s.warehouse=n(s.warehouse,o.warehouse),s.shop=Re(s.shop,o.shop),s.available_qty=(s.available_qty||0)+(o.available_qty||0),s.actual_stock=(s.actual_stock||0)+(o.actual_stock||0),!s.image_url&&o.image_url&&(s.image_url=o.image_url),!s.ranking_result&&o.ranking_result&&(s.ranking_result=o.ranking_result),!s.sample_number&&o.sample_number&&(s.sample_number=o.sample_number),s.ranking_result||(s.ranking_result="新品")}else t.set(i,{product_name:i,product_id:o.product_id||"",shop:o.shop||"",ranking_result:o.ranking_result||"新品",sample_number:o.sample_number||"",image_url:o.image_url||"",warehouse:o.warehouse||"",available_qty:o.available_qty||0,actual_stock:o.actual_stock||0})});const r=Array.from(t.values());return r.sort((o,i)=>{const s=o.sample_number||"",l=i.sample_number||"",c=s.replace(/[0-9]/g,"")||"Z",u=l.replace(/[0-9]/g,"")||"Z";if(c!==u)return c.localeCompare(u);const p=parseInt(s.replace(/\D/g,""))||999,g=parseInt(l.replace(/\D/g,""))||999;return p-g}),r}async function Sn(e){console.log(`<i data-lucide="save"></i> [历史记录] 开始保存到 mapping_history, 共 ${e.length} 条`);const a=window.supabaseClient;if(!a)throw new Error("Supabase 未初始化");console.log("🧹 [历史记录] 清空现有记录..."),await a.from("mapping_history").delete().gte("id",0);const t=new Date().toISOString(),n=await hn(),r=e.map(i=>({...i,shop:n[String(i.product_id??"").trim()]||i.shop||null,generated_at:t})),o=100;for(let i=0;i<r.length;i+=o){const s=r.slice(i,i+o);console.log(`<i data-lucide="upload"></i> [历史记录] 插入批次 ${Math.floor(i/o)+1}/${Math.ceil(r.length/o)}`);const{error:l}=await a.from("mapping_history").insert(s);if(l)throw new Error("保存历史记录失败: "+l.message)}return console.log(`<i data-lucide="check-circle"></i> [历史记录] 保存完成, 共 ${r.length} 条`),r.length}async function En(){console.log("📜 [历史记录] 正在加载历史数据...");const e=window.supabaseClient;if(!e)return[];const{data:a,error:t}=await e.from("mapping_history").select("*").order("ranking_result",{ascending:!0});return t?(console.warn('<i data-lucide="alert-triangle"></i> [历史记录] 加载失败:',t.message),[]):(console.log(`<i data-lucide="check-circle"></i> [历史记录] 加载完成, 共 ${(a==null?void 0:a.length)||0} 条`),a||[])}function $n(){return`
        <div class="mapping-page">
            <div class="page-intro flex-between flex-wrap-gap" style="align-items: flex-start;">
                <div class="flex-1" style="min-width: 200px;">
                    <h2><i data-lucide="link"></i> 排品结果推送 <span class="tag-red">插件读取</span></h2>
                    <p>合并显示排品结果和新品数据，自动计算样品仓位</p>
                </div>
                <div id="dataSourceCards" class="flex-wrap-gap">
                    <div class="source-card source-card-blue">
                        <div class="source-card-label"><i data-lucide="upload"></i> 推送保存至</div>
                        <div class="source-card-value">mapping_history</div>
                    </div>
                    <div class="source-card source-card-green">
                        <div class="source-card-label">📥 排品数据源</div>
                        <div class="source-card-value">ranking_results <span id="rankingCountBadge" style="color: #10b981; margin-left: 4px; font-weight: bold;"></span></div>
                    </div>
                    <div id="newProductSourceCard" class="source-card source-card-amber">
                        <div class="source-card-label"><i data-lucide="package"></i> 新品数据源</div>
                        <div class="source-card-value">new_product_data <span id="newProductCountBadge" style="color: #f59e0b; margin-left: 4px; font-weight: bold;"></span></div>
                    </div>
                    <div id="welfareSourceCard" class="source-card source-card-pink">
                        <div class="source-card-label"><i data-lucide="gift"></i> 福利品数据源</div>
                        <div class="source-card-value">welfare_data <span id="welfareCountBadge" style="color: #ec4899; margin-left: 4px; font-weight: bold;"></span></div>
                    </div>
                </div>
            </div>
            
            <div class="mapping-actions mapping-actions-bar">
                <button class="btn btn-primary" id="btnSaveHistory">📱 推送到手机/插件</button>
                <div class="toggle-btn-group">
                    <button type="button" class="toggle-btn active" id="btnIncludeNewProduct">
                        （大号）包含新品
                    </button>
                    <button type="button" class="toggle-btn" id="btnExcludeNewProduct">
                        （小号）不含新品
                    </button>
                </div>
                <input type="hidden" id="mappingIncludeNew" value="true">
                <button class="btn btn-outline" id="btnRefreshMapping" style="border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); height: 36px;"><i data-lucide="refresh-cw"></i> 刷新数据</button>
                <button class="btn btn-secondary" id="btnUpdateWarehouse" style="border: 1px solid var(--border-color); height: 36px;"><i data-lucide="package"></i> 更新仓位</button>
                <span id="mappingStatus" style="color: var(--text-muted); font-size: 0.875rem; margin-left: auto;"></span>
            </div>
            
            <div class="mapping-content">
                <div class="welfare-section">
                    <h3 class="section-title-sm"><i data-lucide="gift"></i> 福利排品商品<span class="tag-pink">独立表格显示，合并推送</span></h3>
                    <div id="welfareTableContainer" class="data-table-container welfare-table-border">
                        <div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;">
                            <p>正在加载福利数据...</p>
                        </div>
                    </div>
                </div>
                <div class="ranking-section">
                    <h3 class="section-title-sm"><i data-lucide="clipboard-list"></i> 常规排品商品</h3>
                    <div id="mappingTableContainer" class="data-table-container">
                        <div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;">
                            <p>正在加载数据...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 更新仓位对话框 -->
            <div id="warehouseUpdateDialog" class="modal-overlay" style="display: none;">
                <div class="modal-content warehouse-dialog-content">
                    <div class="flex-between mb-md">
                        <h3 style="margin: 0;"><i data-lucide="package"></i> 更新仓位 <span style="color: #ff4444; font-size: 0.75rem; font-weight: normal;">需下载最新库存视图新品表格，注意商品名称准确</span></h3>
                        <button id="closeWarehouseDialog" class="modal-close">&times;</button>
                    </div>
                    
                    <div id="warehouseUploadZone" class="warehouse-dropzone">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                        <p style="margin: 0.5rem 0; color: var(--text-primary);">拖拽文件到此处,或点击选择</p>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">.xlsx, .xls, .csv</p>
                        <input type="file" id="warehouseFileInput" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div id="warehouseUpdateStatus" style="display: none; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); margin-bottom: 1rem;">
                        <div id="warehouseStatusText" class="mb-sm">准备中...</div>
                        <div class="progress-bar"><div id="warehouseProgressBar" class="progress-fill" style="width: 0%;"></div></div>
                        <div id="warehouseStatusDetail" class="mt-sm" style="font-size: 0.875rem; color: var(--text-secondary);"></div>
                    </div>
                    
                    <div class="mt-md" style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">说明:读取表格的商品名称(B列)和主仓位(H列),更新 mapping_history 表中匹配商品的仓位信息</p>
                    </div>
                </div>
            </div>
        </div>
    `}async function Cn(){var d,y,b;const e=document.getElementById("mappingTableContainer"),a=document.getElementById("welfareTableContainer"),t=document.getElementById("mappingStatus"),n=_=>{t&&(t.textContent=_)},r=await Ct(),o=(r==null?void 0:r.rules)||[],i=document.getElementById("btnIncludeNewProduct"),s=document.getElementById("btnExcludeNewProduct"),l=document.getElementById("mappingIncludeNew"),c=document.getElementById("newProductSourceCard"),u=document.getElementById("rankingCountBadge"),p=document.getElementById("newProductCountBadge"),g=document.getElementById("welfareCountBadge");function m(_,S){c&&(c.style.display=_?"block":"none"),S?(u&&(u.textContent=`(${S.rankingCount}个)`),p&&_&&(p.textContent=`(${S.newProductCount}个)`),g&&(g.textContent=`(${S.welfareCount||0}个)`)):(u&&(u.textContent=""),p&&(p.textContent=""),g&&(g.textContent=""))}function f(_){l.value=_?"true":"false",_?(i.style.background="var(--primary-color)",i.style.color="white",s.style.background="var(--bg-secondary)",s.style.color="var(--text-secondary)"):(s.style.background="var(--primary-color)",s.style.color="white",i.style.background="var(--bg-secondary)",i.style.color="var(--text-secondary)"),m(_,null),L()}i==null||i.addEventListener("click",()=>f(!0)),s==null||s.addEventListener("click",()=>f(!1));const L=async()=>{const _=l.value==="true";n("加载中...");try{const S=_n(_),B=window.supabaseClient.from("welfare_arranged_data").select("*"),[k,v]=await Promise.all([S,B]),C=v.data||[],I=C.map(D=>({product_name:D.product_name,product_id:"",ranking_result:"福利品",sample_number:"",image_url:D.image_url||"",warehouse:"",available_qty:D.available_qty||0,actual_stock:0,sample_warehouse:""}));k._sourceStats&&(k._sourceStats.welfareCount=C.length,m(_,k._sourceStats)),k.forEach(D=>{D.sample_warehouse=wn(D.warehouse,o)}),nt(e,k),a&&nt(a,I),n(`常规 ${k.length} 个 / 福利 ${I.length} 个`),window._currentMappingData=k,window._currentWelfareData=I}catch(S){console.error(S),e.innerHTML=`<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p style="color: var(--error-color);">加载失败: ${S.message}</p></div>`,a&&(a.innerHTML='<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p style="color: var(--error-color);">加载失败</p></div>'),n("加载失败")}};(d=document.getElementById("btnRefreshMapping"))==null||d.addEventListener("click",L),(y=document.getElementById("btnSaveHistory"))==null||y.addEventListener("click",async()=>{var _,S,B,k,v,C,I;if(!window._currentMappingData||!window._currentWelfareData){(S=(_=window.AppUtils)==null?void 0:_.showToast)==null||S.call(_,"请先刷新数据","warning");return}try{const D=[...window._currentWelfareData,...window._currentMappingData],M=await Sn(D);try{const P=window.supabaseClient;if(P){const{data:h}=await P.from("ranking_config").select("config_value").eq("config_key","ranking_schemes").single(),$=((B=h==null?void 0:h.config_value)==null?void 0:B.当前方案)||"默认方案";await P.from("ranking_config").upsert({config_key:"pushed_scheme_name",config_value:{name:$},updated_at:new Date().toISOString()},{onConflict:"config_key"}),console.log(`<i data-lucide="check-circle"></i> [推送] 方案名称已同步: ${$}`)}}catch(P){console.warn("推送方案名称失败:",P)}(v=(k=window.AppUtils)==null?void 0:k.showToast)==null||v.call(k,`已成功推送 ${M} 条 (常规 ${window._currentMappingData.length} + 福利 ${window._currentWelfareData.length})`,"success")}catch(D){(I=(C=window.AppUtils)==null?void 0:C.showToast)==null||I.call(C,"保存失败: "+D.message,"error")}}),(b=document.getElementById("btnUpdateWarehouse"))==null||b.addEventListener("click",()=>{document.getElementById("warehouseUpdateDialog").style.display="flex"}),Dn(),await L()}function nt(e,a){if(!a||a.length===0){e.innerHTML='<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p>暂无数据</p></div>';return}const t={"1.评分品A":"rgba(139, 69, 19, 0.15)","2.佩戴品":"rgba(0, 128, 128, 0.15)","3.周边品":"rgba(128, 0, 128, 0.15)","4.评分品B":"rgba(184, 134, 11, 0.15)","5.库存品":"rgba(85, 107, 47, 0.15)",新品:"rgba(70, 130, 180, 0.15)",福利品:"rgba(236,72,153, 0.15)"},n=`
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
                <tr style="background: var(--bg-secondary);">
                    <th style="padding: 0.75rem; text-align: center; width: 60px;">图片</th>
                    <th style="padding: 0.75rem; text-align: left;">商品名称</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">分类</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">序号</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">样品仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 70px;">可用数</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">实际库存</th>
                </tr>
            </thead>
            <tbody>
                ${a.map(r=>{const o=r.image_url?r.image_url.split(",")[0].trim():"",i=o?`<div class="hover-zoom-container">
                   <img src="${o}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>无图</span>'">
               </div>`:'<span style="color: var(--text-muted);">无</span>';return`
                        <tr style="border-bottom: 1px solid var(--border-color); background: ${t[r.ranking_result]||"transparent"};">
                            <td style="padding: 0.5rem; text-align: center;">${i}</td>
                            <td style="padding: 0.5rem;">${r.product_name||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.ranking_result||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.sample_number||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.warehouse||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center; color: var(--primary-color);">${r.sample_warehouse||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.available_qty||0}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.actual_stock||0}</td>
                        </tr>
                    `}).join("")}
            </tbody>
        </table>
    `;e.innerHTML=n}function In(){return`
        <div class="mapping-history-page">
            <div class="page-intro">
                <h2>📜 历史记录 <span class="db-table-tag">mapping_history</span></h2>
                <p>显示上一次保存的对照结果</p>
            </div>
            
            <div id="historyCopyButtonsContainer" style="padding: 0 1.5rem;"></div>
            
            <div class="history-info p-section">
                <span id="historyGeneratedTime" class="uploaded-stats"></span>
            </div>
            
            <div class="history-content p-content">
                <div id="historyTableContainer" class="data-table-container">
                    <div class="placeholder-content">
                        <p>正在加载历史记录...</p>
                    </div>
                </div>
            </div>
        </div>
    `}function Tn(e,a){if(!a||a.length===0){e.innerHTML='<div class="placeholder-content" style="min-height: 150px; padding: 2rem 0;"><p>暂无数据</p></div>';return}const t={"1.评分品A":"rgba(139, 69, 19, 0.15)","2.佩戴品":"rgba(0, 128, 128, 0.15)","3.周边品":"rgba(128, 0, 128, 0.15)","4.评分品B":"rgba(184, 134, 11, 0.15)","5.库存品":"rgba(85, 107, 47, 0.15)",新品:"rgba(70, 130, 180, 0.15)",福利品:"rgba(236,72,153, 0.15)"},n=`
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
                <tr style="background: var(--bg-secondary);">
                    <th style="padding: 0.75rem; text-align: center; width: 60px;">图片</th>
                    <th style="padding: 0.75rem; text-align: left; width: 360px;">商品名称</th>
                    <th style="padding: 0.75rem; text-align: center; width: 120px;">商品 ID</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">店铺</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">分类</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">序号</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 100px;">样品仓位</th>
                    <th style="padding: 0.75rem; text-align: center; width: 70px;">可用数</th>
                    <th style="padding: 0.75rem; text-align: center; width: 80px;">实际库存</th>
                </tr>
            </thead>
            <tbody>
                ${a.map(r=>{const o=r.image_url?r.image_url.split(",")[0].trim():"",i=o?`<div class="hover-zoom-container">
                   <img src="${o}" class="hover-zoom-thumb" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--text-muted); font-size: 0.625rem;\\'>无图</span>'">
               </div>`:'<span style="color: var(--text-muted);">无</span>';return`
                        <tr style="border-bottom: 1px solid var(--border-color); background: ${t[r.ranking_result]||"transparent"};">
                            <td style="padding: 0.5rem; text-align: center;">${i}</td>
                            <td style="padding: 0.5rem; max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${r.product_name||""}">${r.product_name||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary);">${r.product_id||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${bn(r.shop)}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.ranking_result||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.sample_number||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.warehouse||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center; color: var(--primary-color);">${r.sample_warehouse||"--"}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.available_qty||0}</td>
                            <td style="padding: 0.5rem; text-align: center;">${r.actual_stock||0}</td>
                        </tr>
                    `}).join("")}
            </tbody>
        </table>
    `;e.innerHTML=n}function Ln(e){const a=document.getElementById("historyCopyButtonsContainer");if(!a)return;const t=e.filter(c=>!(c.ranking_result||"").includes("福利")),n=e.filter(c=>(c.ranking_result||"").includes("福利")),r=30,o=Math.ceil(t.length/r);let i='<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">';i+='<span style="font-size: 0.85rem; color: var(--text-muted); margin-right: 0.25rem;">📋 批量复制链接:</span>';for(let c=0;c<o;c++){const u=c*r,p=Math.min(u+r,t.length);i+=`<button class="btn btn-outline history-copy-batch-btn" data-batch-start="${u}" data-batch-end="${p}" 
            style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 6px; cursor: pointer; background: transparent; transition: all 0.2s;"
            onmouseover="this.style.background='var(--primary-color)'; this.style.color='white';"
            onmouseout="this.style.background='transparent'; this.style.color='var(--primary-color)';">
            第${c+1}组 (${u+1}-${p})
        </button>`}n.length>0&&(i+=`<button class="btn history-copy-welfare-btn" 
            style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: 1px solid #ec4899; color: #ec4899; border-radius: 6px; cursor: pointer; background: transparent; transition: all 0.2s; margin-left: 0.5rem;"
            onmouseover="this.style.background='#ec4899'; this.style.color='white';"
            onmouseout="this.style.background='transparent'; this.style.color='#ec4899';">
            🎁 福利品名称 (${n.length}个)
        </button>`),i+="</div>",a.innerHTML=i;const s=c=>`https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html?id=${c}&origin_type=604`;a.querySelectorAll(".history-copy-batch-btn").forEach(c=>{c.addEventListener("click",async()=>{var f,L,d,y,b,_;const u=parseInt(c.dataset.batchStart),p=parseInt(c.dataset.batchEnd),g=t.slice(u,p),m=g.filter(S=>S.product_id).map(S=>s(S.product_id)).join(`
`);if(!m){(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"该组商品无有效商品 ID","warning");return}try{await navigator.clipboard.writeText(m),c.textContent="✅ 已复制",c.style.background="var(--success-color)",c.style.color="white",c.style.borderColor="var(--success-color)",(y=(d=window.AppUtils)==null?void 0:d.showToast)==null||y.call(d,`已复制 ${g.filter(S=>S.product_id).length} 个商品链接`,"success"),setTimeout(()=>{const S=Math.floor(u/r);c.textContent=`第${S+1}组 (${u+1}-${p})`,c.style.background="transparent",c.style.color="var(--primary-color)",c.style.borderColor="var(--primary-color)"},2e3)}catch(S){(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"复制失败: "+S.message,"error")}})});const l=a.querySelector(".history-copy-welfare-btn");l&&l.addEventListener("click",async()=>{var u,p,g,m,f,L;const c=n.filter(d=>d.product_name).map(d=>d.product_name).join("，");if(!c){(p=(u=window.AppUtils)==null?void 0:u.showToast)==null||p.call(u,"福利品无有效商品名称","warning");return}try{await navigator.clipboard.writeText(c),l.textContent="✅ 已复制",l.style.background="#ec4899",l.style.color="white",(m=(g=window.AppUtils)==null?void 0:g.showToast)==null||m.call(g,`已复制 ${n.filter(d=>d.product_name).length} 个福利品名称`,"success"),setTimeout(()=>{l.textContent=`🎁 福利品名称 (${n.length}个)`,l.style.background="transparent",l.style.color="#ec4899"},2e3)}catch(d){(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"复制失败: "+d.message,"error")}})}async function Bn(){const e=document.getElementById("historyTableContainer"),a=document.getElementById("historyGeneratedTime");try{const t=await En();if(t.sort((n,r)=>{const o=n.sample_number||"",i=r.sample_number||"",s=o.replace(/[0-9]/g,"")||"Z",l=i.replace(/[0-9]/g,"")||"Z";if(s!==l)return s.localeCompare(l);const c=parseInt(o.replace(/\D/g,""))||999,u=parseInt(i.replace(/\D/g,""))||999;return c-u}),t.length>0&&t[0].generated_at){const n=new Date(t[0].generated_at).toLocaleString("zh-CN");a.textContent=`生成时间: ${n}`}else a.textContent="";Ln(t),Tn(e,t)}catch(t){console.error(t),e.innerHTML='<div class="placeholder-content"><p style="color: var(--error-color);">加载失败</p></div>'}}function Mn(){return`
        <div class="mapping-settings-page">
            <div class="page-intro">
                <h2>⚙️ 对照设置</h2>
                <p>配置仓位到样品仓位的映射规则</p>
            </div>
            
            <div class="settings-content settings-grid-2">
                <!-- 左侧：仓位映射规则 -->
                <div class="settings-card">
                    <h3 style="margin: 0 0 1rem;"><i data-lucide="package"></i> 样品仓仓位映射规则</h3>
                    <p class="uploaded-stats mb-md">
                        仓位格式为 X-Y-Z，第二位 Y 在区间内时替换为对应样品仓位
                    </p>
                    
                    <div class="rule-editor rule-editor-grid">
                        <div>
                            <label class="form-label-row">区间起始</label>
                            <input type="number" id="ruleRangeStart" class="form-input" value="1" min="1">
                        </div>
                        <div>
                            <label class="form-label-row">区间结束</label>
                            <input type="number" id="ruleRangeEnd" class="form-input" value="10" min="1">
                        </div>
                        <div>
                            <label class="form-label-row">样品仓位</label>
                            <select id="ruleSampleValue" class="form-input" style="height: 38px;">
                                <option value="">请选择</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="btnAddRule" style="height: 38px;">➕ 添加</button>
                    </div>
                    
                    <div id="rulesListContainer" class="mt-md">
                        <h4 class="mb-sm" style="margin-top: 0; color: var(--text-secondary); font-size: 0.875rem;">已添加规则：</h4>
                        <div id="rulesList"></div>
                    </div>
                    
                    <div class="mt-lg" style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-primary" id="btnSaveConfig"><i data-lucide="save"></i> 保存规则</button>
                    </div>
                </div>
                
                <!-- 右侧：样品仓位选项设置 -->
                <div class="settings-card">
                    <h3 style="margin: 0 0 1rem;"><i data-lucide="clipboard-list"></i> 样品仓位选项</h3>
                    <p class="uploaded-stats mb-md">
                        每行一个选项，保存后可在左侧下拉栏选择
                    </p>
                    
                    <textarea id="sampleOptions" class="form-input" rows="10" style="font-family: monospace; resize: vertical;" placeholder="例如：
1-10-1
1-10-2
1-10-3
1-10-4
1-10-5"></textarea>
                    
                    <div class="mt-md">
                        <button class="btn btn-primary" id="btnSaveOptions"><i data-lucide="save"></i> 保存选项</button>
                    </div>
                </div>
            </div>
        </div>
    `}async function An(){var l,c,u;const e=document.getElementById("rulesList"),a=document.getElementById("ruleSampleValue"),t=document.getElementById("sampleOptions");let n=[],r=[];const o=await Ct();n=(o==null?void 0:o.rules)||[],r=(o==null?void 0:o.sample_options)||[],t.value=r.join(`
`),i(),s();function i(){const p=t.value.split(`
`).map(g=>g.trim()).filter(Boolean);a.innerHTML='<option value="">请选择</option>'+p.map(g=>`<option value="${g}">${g}</option>`).join("")}function s(){if(n.length===0){e.innerHTML='<p style="color: var(--text-muted); font-size: 0.875rem;">暂无规则</p>';return}e.innerHTML=n.map((p,g)=>`
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); margin-bottom: 0.5rem;">
                <span style="flex: 1;">第二位 <strong>${p.range_start}</strong> ~ <strong>${p.range_end}</strong> → <strong style="color: var(--primary-color);">${p.sample_value}</strong></span>
                <button class="btn btn-sm" onclick="window._removeRule(${g})" style="padding: 0.25rem 0.5rem; background: var(--error-color); color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
            </div>
        `).join("")}(l=document.getElementById("btnAddRule"))==null||l.addEventListener("click",()=>{var f,L,d,y,b,_;const p=parseInt(document.getElementById("ruleRangeStart").value),g=parseInt(document.getElementById("ruleRangeEnd").value),m=a.value;if(isNaN(p)||isNaN(g)){(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"请填写有效数值","warning");return}if(!m){(y=(d=window.AppUtils)==null?void 0:d.showToast)==null||y.call(d,"请选择样品仓位","warning");return}if(p>g){(_=(b=window.AppUtils)==null?void 0:b.showToast)==null||_.call(b,"区间起始不能大于结束","warning");return}n.push({range_start:p,range_end:g,sample_value:m}),s()}),window._removeRule=p=>{n.splice(p,1),s()},(c=document.getElementById("btnSaveConfig"))==null||c.addEventListener("click",async()=>{var p,g,m,f;try{const L=t.value.split(`
`).map(d=>d.trim()).filter(Boolean);await at({rules:n,sample_options:L}),(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,"规则已保存","success")}catch(L){(f=(m=window.AppUtils)==null?void 0:m.showToast)==null||f.call(m,"保存失败: "+L.message,"error")}}),(u=document.getElementById("btnSaveOptions"))==null||u.addEventListener("click",async()=>{var p,g,m,f;try{const L=t.value.split(`
`).map(d=>d.trim()).filter(Boolean);await at({rules:n,sample_options:L}),i(),(g=(p=window.AppUtils)==null?void 0:p.showToast)==null||g.call(p,"选项已保存","success")}catch(L){(f=(m=window.AppUtils)==null?void 0:m.showToast)==null||f.call(m,"保存失败: "+L.message,"error")}})}function Dn(){const e=document.getElementById("warehouseUpdateDialog"),a=document.getElementById("warehouseUploadZone"),t=document.getElementById("warehouseFileInput"),n=document.getElementById("closeWarehouseDialog"),r=document.getElementById("warehouseUpdateStatus"),o=document.getElementById("warehouseStatusText"),i=document.getElementById("warehouseProgressBar"),s=document.getElementById("warehouseStatusDetail"),l=()=>{e.style.display="none",r.style.display="none",a.innerHTML=`
            <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
            <p style="margin: 0.5rem 0; color: var(--text-primary);">拖拽文件到此处,或点击选择</p>
            <p style="margin: 0; color: var(--text-muted); font-size: 0.875rem;">.xlsx, .xls, .csv</p>
        `};n==null||n.addEventListener("click",l),e==null||e.addEventListener("click",p=>{p.target===e&&l()}),a==null||a.addEventListener("click",()=>t.click()),a==null||a.addEventListener("dragover",p=>{p.preventDefault(),a.style.borderColor="var(--primary-color)",a.style.background="var(--bg-secondary)"}),a==null||a.addEventListener("dragleave",()=>{a.style.borderColor="var(--border-color)",a.style.background="transparent"}),a==null||a.addEventListener("drop",p=>{p.preventDefault(),a.style.borderColor="var(--border-color)",a.style.background="transparent",p.dataTransfer.files.length>0&&c(p.dataTransfer.files[0])}),t==null||t.addEventListener("change",p=>{p.target.files.length>0&&c(p.target.files[0])});async function c(p){var g,m,f,L;console.log('<i data-lucide="package"></i> [仓位更新] 开始处理文件:',p.name);try{r.style.display="block",u("读取文件...",10);const d=await readExcelFile(p);if(!d||d.length<2)throw new Error("文件内容为空或格式不正确");u("解析数据...",30);const y=[];for(let M=1;M<d.length;M++){const P=d[M];if(!P||P.length===0)continue;const h=String(P[1]??"").trim(),$=String(P[7]??"").trim();h&&$&&y.push({productName:h,warehouse:$})}if(console.log(`📊 [仓位更新] 解析到 ${y.length} 条更新记录`),y.length===0)throw new Error("未找到有效的商品名称和仓位数据");u("匹配商品...",50);const b=window.supabaseClient;if(!b)throw new Error("Supabase 未初始化");const[_,S,B]=await Promise.all([b.from("mapping_history").select("*"),b.from("ranking_results").select("*"),b.from("new_product_data").select("*")]);if(_.error)throw new Error("加载历史数据失败: "+_.error.message);const k=_.data||[],v=S.data||[],C=B.data||[];console.log(`📜 [仓位更新] mapping_history: ${k.length} 条, ranking_results: ${v.length} 条, new_product_data: ${C.length} 条`),u("更新仓位...",70);let I=0,D=0;for(const M of y){let P=!1;const h=k.filter(N=>N.product_name===M.productName);if(h.length>0){P=!0;for(const N of h){const{error:q}=await b.from("mapping_history").update({warehouse:M.warehouse}).eq("id",N.id);q||D++}}const $=v.filter(N=>N.product_name===M.productName);if($.length>0){P=!0;for(const N of $){const{error:q}=await b.from("ranking_results").update({warehouse:M.warehouse}).eq("id",N.id);q||D++}}const A=C.filter(N=>N.product_name===M.productName);if(A.length>0){P=!0;for(const N of A){const{error:q}=await b.from("new_product_data").update({warehouse:M.warehouse}).eq("id",N.id);q||D++}}P&&(I++,console.log(`✓ [仓位更新] 匹配到商品: ${M.productName}, 更新仓位: ${M.warehouse}`))}u("完成!",100),s.innerHTML=`<span style="color: var(--success-color);"><i data-lucide="check-circle"></i> 成功匹配 ${I} 个商品, 更新 ${D} 条记录</span>`,(m=(g=window.AppUtils)==null?void 0:g.showToast)==null||m.call(g,`成功更新 ${D} 条仓位记录`,"success"),setTimeout(()=>{l();const M=document.getElementById("btnRefreshMapping");M&&M.click()},3e3)}catch(d){console.error('<i data-lucide="x-circle"></i> [仓位更新] 处理失败:',d),o.textContent="处理失败",s.innerHTML=`<span style="color: var(--error-color);"><i data-lucide="x-circle"></i> ${d.message}</span>`,(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"更新失败: "+d.message,"error")}}function u(p,g){o.textContent=p,i.style.width=g+"%"}}window.loadMappingPage=function(e){switch(e){case"mapping":return{html:$n(),init:Cn};case"mapping-history":return{html:In(),init:Bn};case"mapping-settings":return{html:Mn(),init:An};default:return null}};let Y=[];function zn(e){console.log(`<i data-lucide="ticket"></i> [发券品处理] 开始解析数据, 原始行数: ${(e==null?void 0:e.length)||0}`);const a=[];for(let t=1;t<e.length;t++){const n=e[t];if(!n||n.length===0)continue;const r=String(n[1]??"").trim();if(!r||r==="nan")continue;const o=String(n[0]??"").trim(),i=String(n[2]??"").trim();a.push({image_url:o!=="nan"?o:"",product_name:r,product_code:i!=="nan"?i:"",product_id:"",matched:!1})}return console.log(`<i data-lucide="check-circle"></i> [发券品处理] 解析完成, 有效记录: ${a.length} 条`),a}async function Pn(e){if(!e||e.length===0)return e;console.log(`🔍 [发券品ID匹配] 开始匹配, 商品数: ${e.length}`);try{const a=e.map(i=>i.product_name),{data:t,error:n}=await window.supabaseClient.from("product_id_data").select("product_name, product_id").in("product_name",a);if(n)return console.error('<i data-lucide="x-circle"></i> [发券品ID匹配] 查询失败:',n.message),e;const r=new Map;t&&t.forEach(i=>{i.product_name&&i.product_id&&r.set(i.product_name,i.product_id)}),e.forEach(i=>{const s=r.get(i.product_name);s&&(i.product_id=s,i.matched=!0)});const o=e.filter(i=>i.matched).length;return console.log(`<i data-lucide="check-circle"></i> [发券品ID匹配] 完成: ${o}/${e.length} 匹配成功`),e}catch(a){return console.error('<i data-lucide="x-circle"></i> [发券品ID匹配] 异常:',a.message),e}}function Nn(){return`
        <div class="coupon-page">
            <div class="coupon-upload-row">
                <!-- 左侧：上传功能 -->
                <div class="upload-block" id="block-coupon">
                    <div class="upload-block-header">
                        <h3><i data-lucide="ticket"></i> 发券品数据上传 <span class="db-table-tag">→ coupon_product_data</span></h3>
                    </div>
                    
                    <div class="upload-zone" id="uploadZone-coupon">
                        <div class="upload-zone-icon">📁</div>
                        <p>拖拽文件到此处，或点击选择</p>
                        <p class="upload-hint">.xlsx, .xls, .csv</p>
                        <input type="file" id="fileInput-coupon" accept=".xlsx,.xls,.csv" style="display:none">
                    </div>
                    
                    <div class="upload-options">
                        <label class="radio-label">
                            <input type="radio" name="mode-coupon" value="full" checked>
                            <span>更新全部</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="mode-coupon" value="incremental">
                            <span>补充上传</span>
                        </label>
                    </div>

                    <div class="last-upload-info" id="lastUploadInfo">
                        <i data-lucide="clock"></i>
                        <span id="lastUploadTimeText">暂无上传记录</span>
                    </div>
                    
                    <div class="upload-status" id="status-coupon" style="display:none">
                        <div class="status-text" id="statusText-coupon">准备中...</div>
                        <div class="progress-bar"><div class="progress-fill" id="progress-coupon"></div></div>
                        <div class="status-detail" id="statusDetail-coupon"></div>
                    </div>
                </div>
                
                <!-- 右侧：上传说明 -->
                <div class="upload-block coupon-info-block">
                    <div class="upload-block-header">
                        <h3>📖 上传说明</h3>
                    </div>
                    <div class="coupon-info-content">
                        <div class="info-section">
                            <strong><i data-lucide="clipboard-list"></i> 处理规则</strong>
                            <ul>
                                <li>从 product_id_data 表自动匹配商品ID</li>
                                <li>未匹配商品以红色高亮显示</li>
                                <li>可手动填写缺失的商品ID</li>
                                <li>所有商品必须有ID才能上传</li>
                            </ul>
                        </div>
                        <div class="info-section">
                            <strong><i data-lucide="link"></i> 字段映射</strong>
                            <table class="mapping-table">
                                <thead><tr><th>源字段</th><th></th><th>目标字段</th></tr></thead>
                                <tbody>
                                    <tr><td>A列 图片</td><td>→</td><td>image_url</td></tr>
                                    <tr><td>B列 商品名称</td><td>→</td><td>product_name</td></tr>
                                    <tr><td>C列 商品编码</td><td>→</td><td>product_code</td></tr>
                                    <tr><td>自动匹配</td><td>→</td><td>product_id</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 待上传商品列表区域 -->
            <div class="coupon-product-list-section" id="couponProductListSection" style="display:none">
                <div class="section-header">
                    <h3><i data-lucide="package"></i> 待上传商品列表</h3>
                    <div class="section-actions">
                        <span class="match-stats" id="matchStats"></span>
                        <button class="btn btn-secondary btn-outline-blue" id="copyUnmatchedNamesBtn"><i data-lucide="clipboard-list"></i> 批量复制无ID商品名称</button>
                        <button class="btn btn-secondary btn-outline-red" id="clearUnmatchedBtn">🗑️ 清空无ID商品</button>
                        <button class="btn btn-primary" id="uploadBtn-coupon" disabled>上传到数据库</button>
                    </div>
                </div>
                <div class="product-table-container">
                    <table class="product-table" id="couponProductTable">
                        <thead>
                            <tr>
                                <th style="width: 80px;">图片</th>
                                <th style="width: 150px;">商品ID</th>
                                <th>商品名称</th>
                                <th style="width: 150px;">商品编码</th>
                                <th style="width: 80px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="couponProductTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 已上传数据列表区域 -->
            <div class="coupon-product-list-section" id="uploadedDataSection">
                <div class="section-header">
                    <h3><i data-lucide="clipboard-list"></i> 已上传数据 <span class="db-table-tag">coupon_product_data</span></h3>
                    <div class="section-actions">
                        <span class="uploaded-stats" id="uploadedStats">加载中...</span>
                        <button class="btn btn-secondary" id="downloadDataBtn">📥 下载数据</button>
                    </div>
                </div>
                <div class="product-table-container" style="max-height: 400px;">
                    <table class="product-table" id="uploadedDataTable">
                        <thead>
                            <tr>
                                <th style="width: 80px;">图片</th>
                                <th style="width: 150px;">商品ID</th>
                                <th>商品名称</th>
                                <th style="width: 150px;">商品编码</th>
                            </tr>
                        </thead>
                        <tbody id="uploadedDataTableBody">
                        </tbody>
                    </table>
                </div>
                <div class="pagination" id="uploadedDataPagination">
                </div>
            </div>
        </div>
    `}let te=1;const De=20;let me=0,He=[];function Un(){const e=document.getElementById("uploadZone-coupon"),a=document.getElementById("fileInput-coupon"),t=document.getElementById("status-coupon"),n=document.getElementById("statusText-coupon"),r=document.getElementById("progress-coupon"),o=document.getElementById("statusDetail-coupon"),i=document.getElementById("couponProductListSection"),s=document.getElementById("uploadBtn-coupon"),l=document.getElementById("downloadDataBtn");e.addEventListener("click",()=>a.click()),e.addEventListener("dragover",m=>{m.preventDefault(),e.classList.add("dragover")}),e.addEventListener("dragleave",()=>e.classList.remove("dragover")),e.addEventListener("drop",async m=>{m.preventDefault(),e.classList.remove("dragover"),m.dataTransfer.files.length>0&&await p(m.dataTransfer.files[0])}),a.addEventListener("change",async m=>{m.target.files.length>0&&await p(m.target.files[0])}),s.addEventListener("click",On),document.getElementById("clearUnmatchedBtn").addEventListener("click",()=>{var f,L,d,y;const m=Y.filter(b=>!b.product_id).length;if(m===0){(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"没有无ID商品需要清空","info");return}Y=Y.filter(b=>b.product_id),je(),(y=(d=window.AppUtils)==null?void 0:d.showToast)==null||y.call(d,`已清空 ${m} 条无ID商品`,"success")}),document.getElementById("copyUnmatchedNamesBtn").addEventListener("click",async()=>{var L,d,y,b,_,S;const m=Y.filter(B=>!B.product_id);if(m.length===0){(d=(L=window.AppUtils)==null?void 0:L.showToast)==null||d.call(L,"没有无ID商品可复制","info");return}const f=m.map(B=>B.product_name).join(",");try{await navigator.clipboard.writeText(f),(b=(y=window.AppUtils)==null?void 0:y.showToast)==null||b.call(y,`已复制 ${m.length} 个无ID商品名称到剪贴板`,"success")}catch(B){console.error("复制失败:",B),(S=(_=window.AppUtils)==null?void 0:_.showToast)==null||S.call(_,"复制失败，请手动复制","error")}}),l.addEventListener("click",Hn),We(),It();async function p(m){var f,L;e.innerHTML=`<div class="upload-zone-icon"><i data-lucide="check-circle"></i></div><p><strong>${m.name}</strong></p>`;try{t.style.display="block",g("读取文件...",10);const d=await Wn(m);g("解析数据...",30);const y=zn(d);if(y.length===0)throw new Error("无有效数据");g(`已解析 ${y.length} 条，正在匹配商品ID...`,50),await Pn(y),g("匹配完成，请检查列表",100),Y=y,je(),i.style.display="block",o.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 已加载 ${y.length} 条商品</span>`}catch(d){console.error("处理文件失败:",d),n.textContent="处理失败",o.innerHTML=`<span class="error"><i data-lucide="x-circle"></i> ${d.message}</span>`,(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"处理失败: "+d.message,"error")}}function g(m,f){n.textContent=m,r.style.width=f+"%"}}async function We(){console.log("📥 [发券品数据] 正在加载已上传数据...");const e=document.getElementById("uploadedStats"),a=document.getElementById("uploadedDataTableBody"),t=document.getElementById("uploadedDataPagination");try{const{count:n,error:r}=await window.supabaseClient.from("coupon_product_data").select("*",{count:"exact",head:!0});if(r)throw r;if(me=n||0,console.log(`📊 [发券品数据] 总记录数: ${me}`),me===0){e.textContent="暂无数据",a.innerHTML='<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">暂无已上传数据</td></tr>',t.innerHTML="";return}const o=(te-1)*De,{data:i,error:s}=await window.supabaseClient.from("coupon_product_data").select("*").order("id",{ascending:!1}).range(o,o+De-1);if(s)throw s;He=i||[];const l=Math.ceil(me/De);e.textContent=`共 ${me} 条 · 第 ${te}/${l} 页`,qn(),Rn(l),console.log(`<i data-lucide="check-circle"></i> [发券品数据] 加载完成, 当前页 ${He.length} 条`)}catch(n){console.error('<i data-lucide="x-circle"></i> [发券品数据] 加载失败:',n.message),e.textContent="加载失败",a.innerHTML=`<tr><td colspan="4" style="text-align: center; color: var(--error-color); padding: 2rem;">加载失败: ${n.message}</td></tr>`}}function qn(){const e=document.getElementById("uploadedDataTableBody");e.innerHTML=He.map(a=>{let t='<span class="no-image">无图片</span>';return a.image_url&&(t=`<img src="${a.image_url}" alt="商品图片" class="product-thumb" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=\\'no-image\\'>加载失败</span>'" />`),`
            <tr>
                <td class="image-cell">${t}</td>
                <td class="id-cell"><span class="matched-id">${a.product_id||"-"}</span></td>
                <td class="name-cell" title="${a.product_name}">${Tt(a.product_name,40)}</td>
                <td class="code-cell">${a.product_code||"-"}</td>
            </tr>
        `}).join("")}function Rn(e){const a=document.getElementById("uploadedDataPagination");if(e<=1){a.innerHTML="";return}let t='<div class="pagination-controls">';t+=`<button class="pagination-btn" ${te<=1?"disabled":""} data-page="${te-1}">上一页</button>`;const n=5;let r=Math.max(1,te-Math.floor(n/2)),o=Math.min(e,r+n-1);o-r+1<n&&(r=Math.max(1,o-n+1)),r>1&&(t+='<button class="pagination-btn" data-page="1">1</button>',r>2&&(t+='<span class="pagination-ellipsis">...</span>'));for(let i=r;i<=o;i++)t+=`<button class="pagination-btn ${i===te?"active":""}" data-page="${i}">${i}</button>`;o<e&&(o<e-1&&(t+='<span class="pagination-ellipsis">...</span>'),t+=`<button class="pagination-btn" data-page="${e}">${e}</button>`),t+=`<button class="pagination-btn" ${te>=e?"disabled":""} data-page="${te+1}">下一页</button>`,t+="</div>",a.innerHTML=t,a.querySelectorAll(".pagination-btn:not([disabled])").forEach(i=>{i.addEventListener("click",s=>{const l=parseInt(s.target.dataset.page);!isNaN(l)&&l!==te&&(te=l,We())})})}async function Hn(){var a,t,n,r,o,i;const e=document.getElementById("downloadDataBtn");try{e.disabled=!0,e.textContent="⏳ 下载中...";const{data:s,error:l}=await window.supabaseClient.from("coupon_product_data").select("product_id").order("id",{ascending:!1});if(l)throw l;if(!s||s.length===0){(t=(a=window.AppUtils)==null?void 0:a.showToast)==null||t.call(a,"没有数据可下载","warning");return}const c=[["商品ID"]];s.forEach(m=>{c.push([m.product_id||""])});const u=XLSX.utils.book_new(),p=(XLSX.utils.aoa_to_array,XLSX.utils.aoa_to_sheet(c));XLSX.utils.book_append_sheet(u,p,"发券品ID");const g=`发券品ID_${new Date().toISOString().slice(0,10)}.xlsx`;XLSX.writeFile(u,g),(r=(n=window.AppUtils)==null?void 0:n.showToast)==null||r.call(n,`已下载 ${s.length} 条数据`,"success")}catch(s){console.error("下载失败:",s),(i=(o=window.AppUtils)==null?void 0:o.showToast)==null||i.call(o,"下载失败: "+s.message,"error")}finally{e.disabled=!1,e.textContent="📥 下载数据"}}function je(){const e=document.getElementById("couponProductTableBody"),a=document.getElementById("matchStats"),t=document.getElementById("uploadBtn-coupon");if(!e)return;const n=Y.filter(i=>i.product_id).length,o=Y.length-n;a.innerHTML=`
        <span style="color: var(--success-color);"><i data-lucide="check-circle"></i> 已匹配: ${n}</span>
        ${o>0?`<span style="color: var(--error-color); margin-left: 1rem;"><i data-lucide="x-circle"></i> 未匹配: ${o}</span>`:""}
    `,t.disabled=o>0,o>0?t.title="请先填写所有未匹配商品的ID":t.title="",e.innerHTML=Y.map((i,s)=>{const l=!i.product_id,c=l?"unmatched-row":"";let u='<span class="no-image">无图片</span>';i.image_url&&(u=`<img src="${i.image_url}" alt="商品图片" class="product-thumb" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=\\'no-image\\'>加载失败</span>'" />`);let p="";return l?p=`<input type="text" class="id-input" data-index="${s}" placeholder="请输入商品ID" value="${i.product_id||""}">`:p=`<span class="matched-id">${i.product_id}</span>`,`
            <tr class="${c}" data-index="${s}">
                <td class="image-cell">${u}</td>
                <td class="id-cell">${p}</td>
                <td class="name-cell" title="${i.product_name}">${Tt(i.product_name,40)}</td>
                <td class="code-cell">${i.product_code||"-"}</td>
                <td class="action-cell">
                    ${l?`<button class="btn-delete" data-index="${s}" title="删除此商品">🗑️</button>`:""}
                </td>
            </tr>
        `}).join(""),jn()}function jn(){const e=document.getElementById("couponProductTableBody");e&&(e.querySelectorAll(".id-input").forEach(a=>{a.addEventListener("input",t=>{const n=parseInt(t.target.dataset.index);!isNaN(n)&&Y[n]&&(Y[n].product_id=t.target.value.trim(),Fn())}),a.addEventListener("blur",t=>{const n=parseInt(t.target.dataset.index);if(!isNaN(n)&&Y[n]){const r=t.target.closest("tr");Y[n].product_id?r.classList.remove("unmatched-row"):r.classList.add("unmatched-row")}})}),e.querySelectorAll(".btn-delete").forEach(a=>{a.addEventListener("click",t=>{var r,o;const n=parseInt(t.target.dataset.index);isNaN(n)||(Y.splice(n,1),je(),(o=(r=window.AppUtils)==null?void 0:r.showToast)==null||o.call(r,"已删除商品","info"))})}))}function Fn(){const e=document.getElementById("uploadBtn-coupon"),a=document.getElementById("matchStats"),t=Y.filter(o=>o.product_id).length,n=Y.length,r=n-t;a.innerHTML=`
        <span style="color: var(--success-color);"><i data-lucide="check-circle"></i> 已匹配: ${t}</span>
        ${r>0?`<span style="color: var(--error-color); margin-left: 1rem;"><i data-lucide="x-circle"></i> 未匹配: ${r}</span>`:""}
    `,e.disabled=r>0||n===0}async function On(){var l,c,u,p,g,m,f,L;console.log('<i data-lucide="upload"></i> [发券品上传] 开始上传到 coupon_product_data...');const e=document.getElementById("uploadBtn-coupon"),a=document.getElementById("status-coupon"),t=document.getElementById("statusText-coupon"),n=document.getElementById("progress-coupon"),r=document.getElementById("statusDetail-coupon"),o=Y.filter(d=>!d.product_id).length;if(o>0){(c=(l=window.AppUtils)==null?void 0:l.showToast)==null||c.call(l,`还有 ${o} 个商品缺少ID，无法上传`,"error");return}if(Y.length===0){(p=(u=window.AppUtils)==null?void 0:u.showToast)==null||p.call(u,"没有商品可上传","error");return}const i=document.querySelector('input[name="mode-coupon"]:checked'),s=(i==null?void 0:i.value)==="full";console.log(`📝 [发券品上传] 模式: ${s?"全量替换":"补充上传"}, 商品数: ${Y.length}`);try{e.disabled=!0,a.style.display="block",t.textContent="准备上传...",n.style.width="10%";const d=Y.map(_=>({image_url:_.image_url||null,product_name:_.product_name,product_code:_.product_code||null,product_id:_.product_id}));if(s){t.textContent="清空旧数据...",n.style.width="30%",console.log("🧹 [发券品上传] 清空现有数据...");const{error:_}=await window.supabaseClient.from("coupon_product_data").delete().gte("id",0);if(_)throw new Error("清空表失败: "+_.message)}t.textContent="上传数据...",n.style.width="60%";const y=100;for(let _=0;_<d.length;_+=y){const S=d.slice(_,_+y);console.log(`<i data-lucide="upload"></i> [发券品上传] 插入批次 ${Math.floor(_/y)+1}/${Math.ceil(d.length/y)}`);const{error:B}=await window.supabaseClient.from("coupon_product_data").insert(S);if(B)throw new Error("上传失败: "+B.message);const k=60+Math.round(_/d.length*40);n.style.width=k+"%"}t.textContent="上传完成！",n.style.width="100%",r.innerHTML=`<span class="success"><i data-lucide="check-circle"></i> 成功上传 ${d.length} 条商品</span>`;const b=new Date().toLocaleString("zh-CN",{hour12:!1});localStorage.setItem("coupon_last_upload_time",b),It(),console.log(`<i data-lucide="check-circle"></i> [发券品上传] 完成, 共 ${d.length} 条`),(m=(g=window.AppUtils)==null?void 0:g.showToast)==null||m.call(g,`成功上传 ${d.length} 条发券品数据`,"success"),Y=[],document.getElementById("couponProductListSection").style.display="none",te=1,We()}catch(d){console.error('<i data-lucide="x-circle"></i> [发券品上传] 失败:',d.message),t.textContent="上传失败",r.innerHTML=`<span class="error"><i data-lucide="x-circle"></i> ${d.message}</span>`,(L=(f=window.AppUtils)==null?void 0:f.showToast)==null||L.call(f,"上传失败: "+d.message,"error")}finally{e.disabled=!1}}function It(){const e=document.getElementById("lastUploadTimeText");if(!e)return;const a=localStorage.getItem("coupon_last_upload_time");a?e.textContent=`最后上传：${a}`:e.textContent="暂无上传记录"}function Tt(e,a){return e?e.length>a?e.substring(0,a)+"...":e:""}async function Wn(e){return new Promise((a,t)=>{const n=new FileReader;n.onload=r=>{try{const o=new Uint8Array(r.target.result),i=XLSX.read(o,{type:"array"}),s=i.Sheets[i.SheetNames[0]];a(XLSX.utils.sheet_to_json(s,{header:1,defval:""}))}catch(o){t(new Error("解析失败: "+o.message))}},n.onerror=()=>t(new Error("读取失败")),n.readAsArrayBuffer(e)})}function Kn(){return`
        <div class="settings-page">
            <div class="placeholder-content">
                <div class="placeholder-icon">⚙️</div>
                <h3>发券品处理设置</h3>
                <p>此功能正在开发中...</p>
            </div>
        </div>
    `}function Xn(){}window.loadCouponPage=function(e){return e==="coupon"?{html:Nn(),init:Un}:e==="coupon-settings"?{html:Kn(),init:Xn}:null};let Fe=[],ee=1;const ke=20;let ne=0;function Vn(){return`
        <div class="presale-page">
            <div class="upload-block mb-md">
                <div class="upload-block-header flex-between flex-wrap-gap">
                    <h3 style="margin: 0;" class="flex-center gap-sm"><i data-lucide="clipboard-list"></i> 关闭预售 <span class="db-table-tag">presale_product_ids</span></h3>
                    <div class="flex-center gap-md">
                        <span class="presale-stats uploaded-stats" id="presaleStats">加载中...</span>
                        <button class="btn btn-secondary btn-outline-red" id="clearAllBtn">🗑️ 一键清除</button>
                    </div>
                </div>
                
                <!-- 添加区域 -->
                <div class="presale-input-row">
                    <input type="text" id="newProductIdInput" class="form-input flex-1" placeholder="输入商品ID（多个ID用逗号分隔）">
                    <button class="btn btn-primary" id="addProductIdBtn">➕ 添加</button>
                </div>
                
                <!-- 数据表格 -->
                <div class="product-table-container mt-md" style="max-height: 500px;">
                    <table class="product-table" id="presaleTable">
                        <thead>
                            <tr>
                                <th style="width: 60px;">序号</th>
                                <th>商品ID (product_id)</th>
                                <th style="width: 180px;">添加时间</th>
                                <th style="width: 80px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="presaleTableBody">
                        </tbody>
                    </table>
                </div>
                
                <!-- 分页 -->
                <div class="pagination" id="presalePagination"></div>
            </div>
        </div>
    `}function Qn(){console.log('<i data-lucide="clipboard-list"></i> [关预售表] 初始化页面');const e=document.getElementById("addProductIdBtn"),a=document.getElementById("newProductIdInput"),t=document.getElementById("clearAllBtn");e.addEventListener("click",rt),a.addEventListener("keydown",n=>{n.key==="Enter"&&rt()}),t.addEventListener("click",Zn),ye()}async function ye(){console.log("📥 [关预售表] 加载数据...");const e=document.getElementById("presaleStats"),a=document.getElementById("presaleTableBody");try{const{count:t,error:n}=await window.supabaseClient.from("presale_product_ids").select("*",{count:"exact",head:!0});if(n)throw n;if(ne=t||0,console.log(`📊 [关预售表] 总记录数: ${ne}`),ne===0){e.textContent="暂无数据",a.innerHTML='<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">暂无预售商品ID</td></tr>',document.getElementById("presalePagination").innerHTML="";return}const r=(ee-1)*ke,{data:o,error:i}=await window.supabaseClient.from("presale_product_ids").select("*").order("id",{ascending:!1}).range(r,r+ke-1);if(i)throw i;Fe=o||[];const s=Math.ceil(ne/ke);e.textContent=`共 ${ne} 条 · 第 ${ee}/${s} 页`,Jn(),Yn(s),console.log(`<i data-lucide="check-circle"></i> [关预售表] 加载完成, 当前页 ${Fe.length} 条`)}catch(t){console.error('<i data-lucide="x-circle"></i> [关预售表] 加载失败:',t.message),e.textContent="加载失败",a.innerHTML=`<tr><td colspan="4" style="text-align: center; color: var(--error-color); padding: 2rem;">加载失败: ${t.message}</td></tr>`}}function Jn(){const e=document.getElementById("presaleTableBody"),a=(ee-1)*ke;e.innerHTML=Fe.map((t,n)=>{const r=t.created_at?new Date(t.created_at).toLocaleString("zh-CN"):"-";return`
            <tr data-id="${t.id}">
                <td style="text-align: center;">${a+n+1}</td>
                <td><code class="product-id-code">${t.product_id}</code></td>
                <td style="color: var(--text-muted);">${r}</td>
                <td style="text-align: center;">
                    <button class="btn-delete" data-id="${t.id}" title="删除">🗑️</button>
                </td>
            </tr>
        `}).join(""),e.querySelectorAll(".btn-delete").forEach(t=>{t.addEventListener("click",n=>{const r=parseInt(n.target.dataset.id);isNaN(r)||Gn(r)})})}function Yn(e){const a=document.getElementById("presalePagination");if(e<=1){a.innerHTML="";return}let t='<div class="pagination-controls">';t+=`<button class="pagination-btn" ${ee<=1?"disabled":""} data-page="${ee-1}">上一页</button>`;const n=5;let r=Math.max(1,ee-Math.floor(n/2)),o=Math.min(e,r+n-1);o-r+1<n&&(r=Math.max(1,o-n+1)),r>1&&(t+='<button class="pagination-btn" data-page="1">1</button>',r>2&&(t+='<span class="pagination-ellipsis">...</span>'));for(let i=r;i<=o;i++)t+=`<button class="pagination-btn ${i===ee?"active":""}" data-page="${i}">${i}</button>`;o<e&&(o<e-1&&(t+='<span class="pagination-ellipsis">...</span>'),t+=`<button class="pagination-btn" data-page="${e}">${e}</button>`),t+=`<button class="pagination-btn" ${ee>=e?"disabled":""} data-page="${ee+1}">下一页</button>`,t+="</div>",a.innerHTML=t,a.querySelectorAll(".pagination-btn:not([disabled])").forEach(i=>{i.addEventListener("click",s=>{const l=parseInt(s.target.dataset.page);!isNaN(l)&&l!==ee&&(ee=l,ye())})})}async function rt(){var n,r,o,i,s,l,c,u;const e=document.getElementById("newProductIdInput"),a=e.value.trim();if(!a){(r=(n=window.AppUtils)==null?void 0:n.showToast)==null||r.call(n,"请输入商品ID","warning");return}const t=a.split(/[,，\s\n]+/).map(p=>p.trim()).filter(p=>p);if(t.length===0){(i=(o=window.AppUtils)==null?void 0:o.showToast)==null||i.call(o,"请输入有效的商品ID","warning");return}console.log(`➕ [关预售表] 添加 ${t.length} 个商品ID`);try{const p=t.map(m=>({product_id:m})),{error:g}=await window.supabaseClient.from("presale_product_ids").insert(p);if(g)throw g;console.log('<i data-lucide="check-circle"></i> [关预售表] 添加成功'),(l=(s=window.AppUtils)==null?void 0:s.showToast)==null||l.call(s,`成功添加 ${t.length} 个商品ID`,"success"),e.value="",ee=1,ye()}catch(p){console.error('<i data-lucide="x-circle"></i> [关预售表] 添加失败:',p.message),(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"添加失败: "+p.message,"error")}}async function Gn(e){var a,t,n,r;console.log(`🗑️ [关预售表] 删除 ID: ${e}`);try{const{error:o}=await window.supabaseClient.from("presale_product_ids").delete().eq("id",e);if(o)throw o;console.log('<i data-lucide="check-circle"></i> [关预售表] 删除成功'),(t=(a=window.AppUtils)==null?void 0:a.showToast)==null||t.call(a,"已删除","success"),ye()}catch(o){console.error('<i data-lucide="x-circle"></i> [关预售表] 删除失败:',o.message),(r=(n=window.AppUtils)==null?void 0:n.showToast)==null||r.call(n,"删除失败: "+o.message,"error")}}async function Zn(){var e,a,t,n,r,o;if(ne===0){(a=(e=window.AppUtils)==null?void 0:e.showToast)==null||a.call(e,"没有数据需要清除","info");return}if(confirm(`确定要清除全部 ${ne} 条数据吗？此操作不可恢复！`)){console.log("🧹 [关预售表] 清除全部数据");try{const{error:i}=await window.supabaseClient.from("presale_product_ids").delete().gte("id",0);if(i)throw i;console.log('<i data-lucide="check-circle"></i> [关预售表] 清除成功'),(n=(t=window.AppUtils)==null?void 0:t.showToast)==null||n.call(t,`已清除 ${ne} 条数据`,"success"),ee=1,ye()}catch(i){console.error('<i data-lucide="x-circle"></i> [关预售表] 清除失败:',i.message),(o=(r=window.AppUtils)==null?void 0:r.showToast)==null||o.call(r,"清除失败: "+i.message,"error")}}}window.loadPresalePage=function(e){return e==="presale"?{html:Vn(),init:Qn}:null};window.loadInvestmentPage=function(e){return e==="livestream-additional-investment"?{html:er(),init:tr}:null};function er(){return`
        <div class="inv">
            <!-- 页面标题 -->
            <div class="page-intro" style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <h2><i data-lucide="coins"></i> 追投计算</h2>
                    <p>实时计算投放消耗速度，辅助追投决策</p>
                </div>
                <button type="button" class="btn btn-secondary" id="resetBtn"><i data-lucide="refresh-cw"></i> 重置</button>
            </div>

            <!-- 主体：双栏布局 -->
            <div class="inv-grid">
                <!-- 左列：输入区 -->
                <div class="inv-col">
                    <!-- 开播前投放 -->
                    <div class="inv-section">
                        <div class="inv-section-title"><i data-lucide="bar-chart-3"></i> 开播前投放</div>
                        <div class="inv-form-row">
                            <div class="inv-field">
                                <label>投放金额</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preAmount" placeholder="0" min="0" step="1">
                                    <span class="inv-suffix">元</span>
                                </div>
                            </div>
                            <div class="inv-field">
                                <label>投放时长</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preDuration" placeholder="0" min="0" step="0.1">
                                    <span class="inv-suffix">小时</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 已跑时长 -->
                    <div class="inv-section">
                        <div class="inv-section-title"><i data-lucide="clock"></i> 已跑时长</div>
                        <div class="inv-form-row">
                            <div class="inv-field">
                                <label>分钟</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preRunTimeMinutes" placeholder="0" min="0" step="1">
                                    <span class="inv-suffix">min</span>
                                </div>
                            </div>
                            <div class="inv-field">
                                <label>小时</label>
                                <div class="inv-input-box">
                                    <input type="number" id="preRunTime" placeholder="0" min="0" step="0.01">
                                    <span class="inv-suffix">h</span>
                                </div>
                            </div>
                        </div>
                        <div class="inv-quick-row">
                            <button type="button" class="header-quick-btn" data-hours="0.5">0.5h</button>
                            <button type="button" class="header-quick-btn" data-hours="1">1h</button>
                            <button type="button" class="header-quick-btn" data-hours="1.5">1.5h</button>
                            <button type="button" class="header-quick-btn" data-hours="2">2h</button>
                        </div>
                    </div>

                    <!-- 追投配置 -->
                    <div class="inv-section">
                        <div class="inv-section-title"><i data-lucide="rocket"></i> 追投配置</div>
                        <div class="inv-form-row">
                            <div class="inv-field">
                                <label>追投金额</label>
                                <div class="inv-input-box">
                                    <input type="number" id="addAmount" placeholder="0" min="0" step="1">
                                    <span class="inv-suffix">元</span>
                                </div>
                            </div>
                            <div class="inv-field">
                                <label>追投时长</label>
                                <div class="inv-input-box">
                                    <input type="number" id="addDuration" placeholder="0" min="0" step="0.1">
                                    <span class="inv-suffix">小时</span>
                                </div>
                            </div>
                        </div>
                        <div class="inv-quick-row">
                            <span class="inv-quick-label">快速填入</span>
                            <button type="button" class="quick-btn" data-amount="300" data-duration="1">300/1h</button>
                            <button type="button" class="quick-btn" data-amount="500" data-duration="1">500/1h</button>
                            <button type="button" class="quick-btn" data-amount="300" data-duration="0.5">300/0.5h</button>
                            <button type="button" class="quick-btn" data-amount="100" data-duration="5">100/5h</button>
                        </div>
                    </div>
                </div>

                <!-- 右列：结果区 -->
                <div class="inv-col">
                    <!-- 开播前指标 -->
                    <div class="inv-section">
                        <div class="inv-section-title"><i data-lucide="trending-up"></i> 开播前消耗指标</div>
                        <div class="inv-metrics">
                            <div class="inv-metric-card">
                                <span class="inv-metric-label">剩余金额</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="preRemaining">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                            <div class="inv-metric-card">
                                <span class="inv-metric-label">分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="preMinuteConsume">--</span>
                                    <span class="inv-metric-unit">元/min</span>
                                </div>
                            </div>
                            <div class="inv-metric-card">
                                <span class="inv-metric-label">5分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="pre5MinConsume">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 追投后指标 -->
                    <div class="inv-section inv-section-highlight">
                        <div class="inv-section-title"><i data-lucide="zap"></i> 追投后消耗指标</div>
                        <div class="inv-metrics">
                            <div class="inv-metric-card inv-metric-accent">
                                <span class="inv-metric-label">剩余金额</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="addRemaining">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                            <div class="inv-metric-card inv-metric-accent">
                                <span class="inv-metric-label">分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="addMinuteConsume">--</span>
                                    <span class="inv-metric-unit">元/min</span>
                                </div>
                            </div>
                            <div class="inv-metric-card inv-metric-accent">
                                <span class="inv-metric-label">5分钟消耗</span>
                                <div class="inv-metric-val-row">
                                    <span class="inv-metric-value" id="add5MinConsume">--</span>
                                    <span class="inv-metric-unit">元</span>
                                </div>
                            </div>
                        </div>
                        <!-- 合计 -->
                        <div class="inv-total-bar">
                            <span class="inv-total-label">合计消耗</span>
                            <span class="inv-total-value" id="totalConsume">--</span>
                            <span class="inv-total-unit">元</span>
                        </div>
                        <div class="consume-hint" id="consumeHint"></div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            /* ======== 追投计算页面专用样式 ======== */
            .inv { padding: 0; }

            .inv-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            .inv-col {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            /* 区块 */
            .inv-section {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1.25rem;
            }

            .inv-section-highlight {
                border-color: rgba(22, 93, 255, 0.25);
                background: linear-gradient(135deg, rgba(22, 93, 255, 0.04), rgba(22, 93, 255, 0.01));
            }

            .inv-section-title {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--border-color);
            }

            /* 表单行 */
            .inv-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .inv-field label {
                display: block;
                font-size: 0.8rem;
                color: var(--text-muted);
                margin-bottom: 0.4rem;
                font-weight: 500;
            }

            .inv-input-box {
                display: flex;
                align-items: center;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                overflow: hidden;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .inv-input-box:focus-within {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.15);
            }

            .inv-input-box input {
                flex: 1;
                min-width: 0;
                border: none;
                background: transparent;
                padding: 0.6rem 0.75rem;
                font-size: 1rem;
                color: var(--text-primary);
                text-align: right;
                outline: none;
                font-variant-numeric: tabular-nums;
            }

            .inv-input-box input::placeholder {
                color: var(--text-disabled);
            }

            .inv-suffix {
                padding: 0 0.75rem;
                font-size: 0.8rem;
                color: var(--text-muted);
                white-space: nowrap;
                border-left: 1px solid var(--border-color);
                background: rgba(255,255,255,0.02);
                line-height: 2.4;
            }

            /* 快捷按钮行 */
            .inv-quick-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.75rem;
            }

            .inv-quick-label {
                font-size: 0.8rem;
                color: var(--text-muted);
            }

            .header-quick-btn {
                padding: 0.3rem 0.75rem;
                border: 1px solid rgba(255, 125, 0, 0.4);
                border-radius: 14px;
                background: rgba(255, 125, 0, 0.08);
                color: var(--warning-color);
                font-size: 0.78rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .header-quick-btn:hover {
                background: rgba(255, 125, 0, 0.2);
                border-color: var(--warning-color);
            }

            .header-quick-btn:active {
                transform: scale(0.95);
            }

            .quick-btn {
                padding: 0.3rem 0.75rem;
                border: 1px solid rgba(22, 93, 255, 0.4);
                border-radius: 14px;
                background: rgba(22, 93, 255, 0.08);
                color: var(--primary-color);
                font-size: 0.78rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .quick-btn:hover {
                background: var(--primary-color);
                color: white;
            }

            .quick-btn:active {
                transform: scale(0.95);
            }

            /* 指标卡片网格 */
            .inv-metrics {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.75rem;
            }

            .inv-metric-card {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 0.75rem;
                text-align: center;
                transition: border-color 0.2s;
            }

            .inv-metric-card:hover {
                border-color: rgba(255,255,255,0.15);
            }

            .inv-metric-accent {
                border-color: rgba(22, 93, 255, 0.2);
            }

            .inv-metric-accent:hover {
                border-color: rgba(22, 93, 255, 0.4);
            }

            .inv-metric-label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-muted);
                margin-bottom: 0.5rem;
            }

            .inv-metric-val-row {
                display: flex;
                align-items: baseline;
                justify-content: center;
                gap: 0.25rem;
            }

            .inv-metric-value {
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--text-primary);
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                font-variant-numeric: tabular-nums;
                line-height: 1;
            }

            .inv-metric-accent .inv-metric-value {
                color: var(--primary-color);
            }

            .inv-metric-unit {
                font-size: 0.7rem;
                color: var(--text-muted);
            }

            /* 合计行 */
            .inv-total-bar {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                margin-top: 1rem;
                padding: 0.85rem 1rem;
                background: linear-gradient(135deg, rgba(0, 180, 42, 0.1), rgba(0, 180, 42, 0.04));
                border: 1px solid rgba(0, 180, 42, 0.25);
                border-radius: 8px;
            }

            .inv-total-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--text-secondary);
            }

            .inv-total-value {
                font-size: 1.6rem;
                font-weight: 700;
                color: var(--success-color);
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                font-variant-numeric: tabular-nums;
            }

            .inv-total-unit {
                font-size: 0.8rem;
                color: var(--text-muted);
            }

            /* 消耗提示 */
            .consume-hint {
                margin-top: 0.75rem;
                padding: 0.6rem 1rem;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 500;
                text-align: center;
            }

            .consume-hint:empty {
                display: none;
            }

            .consume-hint.decrease {
                background: rgba(0, 180, 42, 0.1);
                color: var(--success-color);
                border: 1px solid rgba(0, 180, 42, 0.25);
            }

            .consume-hint.increase {
                background: rgba(245, 63, 63, 0.1);
                color: var(--error-color);
                border: 1px solid rgba(245, 63, 63, 0.25);
            }

            /* 响应式 */
            @media (max-width: 768px) {
                .inv-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 480px) {
                .inv-metrics {
                    grid-template-columns: 1fr;
                }
                .inv-form-row {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `}function tr(){const e={preRunTime:document.getElementById("preRunTime"),preAmount:document.getElementById("preAmount"),preDuration:document.getElementById("preDuration"),addAmount:document.getElementById("addAmount"),addDuration:document.getElementById("addDuration")},a=document.getElementById("preRunTimeMinutes"),t={preRemaining:document.getElementById("preRemaining"),preMinuteConsume:document.getElementById("preMinuteConsume"),pre5MinConsume:document.getElementById("pre5MinConsume"),addRemaining:document.getElementById("addRemaining"),addMinuteConsume:document.getElementById("addMinuteConsume"),add5MinConsume:document.getElementById("add5MinConsume"),totalConsume:document.getElementById("totalConsume")};function n(){const m=(parseFloat(a.value)||0)/60;e.preRunTime.value=m.toFixed(2),o()}function r(){const m=(parseFloat(e.preRunTime.value)||0)*60;a.value=Math.round(m),o()}function o(){const g=parseFloat(e.preRunTime.value)||0,m=parseFloat(e.preAmount.value)||0,f=parseFloat(e.preDuration.value)||0,L=parseFloat(e.addAmount.value)||0,d=parseFloat(e.addDuration.value)||0;let y=0,b=0,_=0;f>0&&(y=m/f*(f-g),b=m/f/60,_=b*5);let S=0,B=0,k=0,v=0;S=y+L;const C=g+d;C>0&&(B=S/C/60,k=B*5,v=m-y+(L+y)/C),t.preRemaining.textContent=i(y),t.preMinuteConsume.textContent=i(b),t.pre5MinConsume.textContent=i(_),t.addRemaining.textContent=i(S),t.addMinuteConsume.textContent=i(B),t.add5MinConsume.textContent=i(k),t.totalConsume.textContent=i(v);const I=document.getElementById("consumeHint");I&&(b>0&&B>0?b>B?(I.textContent="📉 降低消耗速度及总量",I.className="consume-hint decrease"):(I.textContent="📈 加速消耗速度及付费介入量",I.className="consume-hint increase"):(I.textContent="",I.className="consume-hint"))}function i(g){return isNaN(g)||!isFinite(g)?"--":g.toFixed(2)}const s={preAmount:200,preDuration:2};function l(){a&&(a.value=""),Object.entries(e).forEach(([g,m])=>{s[g]!==void 0?m.value=s[g]:m.value=""}),o()}a&&a.addEventListener("input",n),e.preRunTime&&e.preRunTime.addEventListener("input",r),Object.values(e).forEach(g=>{g&&g!==e.preRunTime&&g.addEventListener("input",o)});const c=document.getElementById("resetBtn");c&&c.addEventListener("click",l),document.querySelectorAll(".quick-btn").forEach(g=>{g.addEventListener("click",()=>{const m=g.dataset.amount,f=g.dataset.duration;e.addAmount.value=m,e.addDuration.value=f,o()})}),document.querySelectorAll(".header-quick-btn").forEach(g=>{g.addEventListener("click",()=>{const m=parseFloat(g.dataset.hours);e.preRunTime.value=m,a.value=Math.round(m*60),o()})}),l()}function ar(){return`
        <div class="shadowbot-page page-centered">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🤖 影刀链接转换器</h3>
                </div>
                
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">基础 URL (Base URL)</label>
                        <input type="text" id="shadowbot-baseUrl" class="form-input" value="https://ugadhdhwixrejzfcwugj.supabase.co/rest/v1/new_product_data">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">查询字段 (Select Field)</label>
                        <input type="text" id="shadowbot-selectField" class="form-input" value="product_code">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">过滤字段 (Filter Field)</label>
                        <input type="text" id="shadowbot-filterField" class="form-input" value="category">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">排除关键词 (Exclude Keyword)</label>
                        <input type="text" id="shadowbot-keyword" class="form-input" value="服装">
                    </div>
                    
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">生成的 URL</label>
                        <textarea id="shadowbot-resultUrl" class="form-input" rows="4" readonly style="font-family: monospace; resize: none; word-break: break-all; background: var(--bg-hover); border-color: var(--border-color);"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button id="shadowbot-generateBtn" class="btn btn-primary" style="flex: 1;">生成 URL</button>
                        <button id="shadowbot-copyBtn" class="btn btn-secondary" style="flex: 1;"><i data-lucide="clipboard-list"></i> 复制链接</button>
                    </div>
                </div>
            </div>
        </div>
    `}function nr(){const e=document.getElementById("shadowbot-generateBtn"),a=document.getElementById("shadowbot-copyBtn"),t=document.getElementById("shadowbot-resultUrl");function n(){var g,m,f,L;const o=((g=document.getElementById("shadowbot-baseUrl").value)==null?void 0:g.trim())||"",i=((m=document.getElementById("shadowbot-selectField").value)==null?void 0:m.trim())||"",s=((f=document.getElementById("shadowbot-filterField").value)==null?void 0:f.trim())||"",l=((L=document.getElementById("shadowbot-keyword").value)==null?void 0:L.trim())||"",c=encodeURIComponent(l),u=`?select=${i}&${s}=not.like.*${c}*`,p=o+u;t.value=p}function r(){var s,l;t.value||""||n();const i=t.value||"";if(!i){(l=(s=window.AppUtils)==null?void 0:s.showToast)==null||l.call(s,"没有可复制的内容","warning");return}navigator.clipboard.writeText(i).then(()=>{var c,u;(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"已成功复制到剪贴板！","success")}).catch(()=>{var c,u;t.select(),document.execCommand("copy"),(u=(c=window.AppUtils)==null?void 0:c.showToast)==null||u.call(c,"已成功复制到剪贴板！","success")})}e.addEventListener("click",n),a.addEventListener("click",r),["shadowbot-baseUrl","shadowbot-selectField","shadowbot-filterField","shadowbot-keyword"].forEach(o=>{document.getElementById(o).addEventListener("input",n)}),n()}window.loadShadowbotPage=function(e){return e==="shadowbot"?{html:ar(),init:nr}:null};const ze=30;function rr(){return`
        <div class="id-converter-page page-centered">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i data-lucide="refresh-cw"></i> ID 转换器（从 ID 批量转换成可上架的商品链接）</h3>
                </div>
                
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">输入商品 ID</label>
                        <textarea id="idConverter-input" class="form-input" rows="4" placeholder="输入商品ID，每行一个，或用英文逗号(,)分隔&#10;例如：&#10;3773267724856328467&#10;3769392377878413340" style="resize: vertical; font-family: monospace;"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1.5rem;">
                        <label class="form-label">生成的链接</label>
                        <textarea id="idConverter-output" class="form-input" rows="6" readonly style="font-family: monospace; resize: vertical; word-break: break-all; background: var(--bg-hover); border-color: var(--border-color);"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button id="idConverter-convertBtn" class="btn btn-primary" style="flex: 1;">生成链接</button>
                    </div>

                    <div id="idConverter-copyArea" style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem;"></div>
                </div>
            </div>
        </div>
    `}function or(){const e=document.getElementById("idConverter-input"),a=document.getElementById("idConverter-output"),t=document.getElementById("idConverter-convertBtn"),n=document.getElementById("idConverter-copyArea"),r="https://haohuo.jinritemai.com/ecommerce/trade/detail/index.html";let o=[];function i(){const l=e.value.trim();if(!l){a.value="",o=[],s();return}o=l.split(/[\n,]/).map(u=>u.trim()).filter(Boolean).map(u=>`${r}?id=${u}&origin_type=604`),a.value=o.join(`
`),s()}function s(){if(n.innerHTML="",o.length===0)return;const l=[];for(let c=0;c<o.length;c+=ze)l.push(o.slice(c,c+ze));l.forEach((c,u)=>{const p=u*ze+1,g=p+c.length-1,m=document.createElement("button");m.className="btn btn-secondary",m.style.cssText="display: flex; align-items: center; gap: 0.4rem;";const f=l.length===1?`<i data-lucide="clipboard-list"></i> 一键复制（${c.length} 个）`:`<i data-lucide="clipboard-list"></i> 复制第 ${p}–${g} 条`;m.innerHTML=f,m.addEventListener("click",()=>{const L=c.join(`
`);navigator.clipboard.writeText(L).then(()=>{var d,y;(y=(d=window.AppUtils)==null?void 0:d.showToast)==null||y.call(d,`已复制第 ${p}–${g} 条链接！`,"success")}).catch(()=>{var y,b;const d=document.createElement("textarea");d.value=L,document.body.appendChild(d),d.select(),document.execCommand("copy"),document.body.removeChild(d),(b=(y=window.AppUtils)==null?void 0:y.showToast)==null||b.call(y,`已复制第 ${p}–${g} 条链接！`,"success")})}),n.appendChild(m)}),window.lucide&&window.lucide.createIcons()}t.addEventListener("click",i),e.addEventListener("input",i)}window.loadIdConverterPage=function(e){return e==="id-converter"?{html:rr(),init:or}:null};function ir(){const e=document.getElementById("productCheckerModal");e&&e.remove();const a=document.createElement("div");a.id="productCheckerModal",a.className="modal-overlay",a.innerHTML=`
        <div class="modal-content product-checker-modal">
            <div class="modal-header">
                <h3><i data-lucide="search-check"></i> 商品数据校验 <span class="db-table-tag">← listing_data_export</span> <span style="color:var(--error-color); font-size:0.85rem; font-weight:normal; margin-left:10px;">（需【同步上链接表】后才可对比）</span></h3>
                <button class="modal-close" id="checkerModalClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="checker-dropzone" id="checkerDropzone">
                    <div class="checker-dropzone-icon">📂</div>
                    <p>拖拽上传表格文件到此处</p>
                    <p class="upload-hint">.xlsx, .xls, .csv</p>
                    <input type="file" id="checkerFileInput" accept=".xlsx,.xls,.csv" style="display:none">
                </div>
                <div class="checker-status" id="checkerStatus" style="display:none">
                    <div class="checker-status-text" id="checkerStatusText">解析中...</div>
                    <div class="progress-bar"><div class="progress-fill" id="checkerProgress"></div></div>
                </div>
                <div class="checker-results" id="checkerResults" style="display:none"></div>
            </div>
        </div>
    `,document.body.appendChild(a),document.getElementById("checkerModalClose").addEventListener("click",()=>a.remove()),a.addEventListener("click",r=>{r.target===a&&a.remove()});const t=document.getElementById("checkerDropzone"),n=document.getElementById("checkerFileInput");t.addEventListener("click",()=>n.click()),t.addEventListener("dragover",r=>{r.preventDefault(),t.classList.add("dragover")}),t.addEventListener("dragleave",()=>t.classList.remove("dragover")),t.addEventListener("drop",r=>{r.preventDefault(),t.classList.remove("dragover"),r.dataTransfer.files.length>0&&ot(r.dataTransfer.files[0])}),n.addEventListener("change",r=>{r.target.files.length>0&&ot(r.target.files[0])}),window.lucide&&window.lucide.createIcons()}async function ot(e){const a=document.getElementById("checkerDropzone"),t=document.getElementById("checkerStatus"),n=document.getElementById("checkerStatusText"),r=document.getElementById("checkerProgress"),o=document.getElementById("checkerResults");a.innerHTML=`<div class="checker-dropzone-icon"><i data-lucide="check-circle"></i></div><p><strong>${e.name}</strong></p>`,window.lucide&&window.lucide.createIcons(),t.style.display="block",o.style.display="none";function i(s,l){n.textContent=s,r.style.width=l+"%"}try{i("读取上传文件...",10);const s=await lr(e);if(!s||s.length<2)throw new Error("表格为空或无有效数据");const l=s[0].map(v=>String(v??"").trim()),c=l.indexOf("商品名称"),u=l.indexOf("商家SKU编码"),p=l.findIndex(v=>v.includes("商品 ID")||v.includes("商品ID")||v==="商品id");if(c===-1)throw new Error('上传表格中未找到"商品名称"列');if(u===-1)throw new Error('上传表格中未找到"商家SKU编码"列');const g=new Set,m=new Set,f=new Map;let L=l.findIndex(v=>v.includes("阶梯库存"));L===-1&&(L=16);const d=new Map,y=new Map,b=new Set;for(let v=1;v<s.length;v++){const C=s[v];let I=String(C[c]??"").trim();I=we(I);const D=String(C[u]??"").trim();if(!I)continue;g.add(I),D&&m.add(D),d.set(I,String(C[L]??"").trim());const M=String(C[9]??"").trim();if(M&&(y.has(M)||y.set(M,[]),y.get(M).push(I)),p!==-1&&!f.has(I)){const h=String(C[p]??"").trim();h&&f.set(I,h)}const P=String(C[0]??"").trim();P&&b.add(P)}i("加载数据库数据...",30);const{data:_,error:S}=await window.supabaseClient.from("listing_data_export").select("*");if(S)throw new Error("读取数据库失败: "+S.message);if(!_||_.length===0)throw new Error("数据库 listing_data_export 中无数据，请先同步上链接表");i("执行校验...",50);const B=[];for(const v of _){let C=(v.product_name||"").trim();C=we(C),C&&(g.has(C)||B.push({type:"missing",label:"缺失商品",name:C,productId:f.get(C)||""}))}i("检查多SKU编码...",65);for(const v of _){if((parseInt(v.sku_count)||0)<=1)continue;let I=(v.product_name||"").trim();I=we(I);const D=(v.virtual_category||"").trim()==="可预售",M=[],P=(v.product_code||"").trim();P&&M.push(P);for(let h=2;h<=10;h++){const $=`product_code_${h}`,A=(v[$]||"").trim();A&&M.push(A)}if(M.length!==0)for(const h of M){const $=h.replace(/==$/g,"");!m.has($)&&!m.has(h)&&B.push({type:"sku",label:"SKU缺失",name:I,productId:f.get(I)||"",detail:`子编码 "${$}" 在上传表格中不存在`})}}for(const[v,C]of y.entries())C.length>1&&B.push({type:"duplicate",label:"编码重复",name:"商品编码异常，有重复。",productId:"",detail:`重复值 "${v}" (相关商品: ${C.join(", ")})`});for(const v of _){if(!((v.virtual_category||"").trim()==="可预售"))continue;let I=(v.product_name||"").trim();if(I=we(I),!I||!d.has(I))continue;const D=d.get(I);D!=="500"&&B.push({type:"inventory",label:"库存异常",name:I,productId:f.get(I)||"",detail:`预售库存填写错误：表内阶梯库存为 "${D}"，规定必须填写为 500`})}i("校验完成",100),sr(B,_.length);const k=Array.from(b);k.length>0&&cr(k).catch(v=>{console.warn("写入商品链接表失败（非致命）:",v)})}catch(s){console.error("商品检查失败:",s),n.textContent="校验失败",n.style.color="var(--error-color)",o.style.display="block",o.innerHTML=`<div class="checker-error"><i data-lucide="x-circle"></i> ${s.message}</div>`,window.lucide&&window.lucide.createIcons()}}function sr(e,a){const t=document.getElementById("checkerResults");if(t.style.display="block",e.length===0){t.innerHTML=`
            <div class="checker-success">
                <div class="checker-success-icon">✅</div>
                <h4>全部通过</h4>
                <p>共校验 ${a} 条商品，未发现异常</p>
            </div>
        `;return}const n=e.filter(u=>u.type==="missing"),r=e.filter(u=>u.type==="sku"),o=e.filter(u=>u.type==="duplicate"),i=e.filter(u=>u.type==="inventory"),s={missing:{bg:"rgba(239, 68, 68, 0.1)",border:"rgba(239, 68, 68, 0.3)",color:"#ef4444",icon:"🚫"},sku:{bg:"rgba(139, 92, 246, 0.1)",border:"rgba(139, 92, 246, 0.3)",color:"#8b5cf6",icon:"🔗"},duplicate:{bg:"rgba(245, 158, 11, 0.1)",border:"rgba(245, 158, 11, 0.3)",color:"#f59e0b",icon:"⚠️"},inventory:{bg:"rgba(236, 72, 153, 0.1)",border:"rgba(236, 72, 153, 0.3)",color:"#ec4899",icon:"📦"}};let l=`
        <div class="checker-summary">
            <span>共校验 <strong>${a}</strong> 条商品，发现 <strong style="color:var(--error-color)">${e.length}</strong> 项异常</span>
        </div>
    `;function c(u,p,g){if(u.length===0)return"";const m=s[g];return`
            <div class="checker-group checker-group-${g}" style="border-radius:8px; padding:1rem; margin-bottom:0.75rem;">
                <h4 class="checker-group-title">${m.icon} ${p}（${u.length}）</h4>
                <div class="checker-items">
                    ${u.map(f=>`
                        <div class="checker-item">
                            ${f.productId?`<a href="https://fxg.jinritemai.com/ffa/g/create?product_id=${f.productId}&cid=33607&entrance=edit" target="_blank" class="checker-link">↗ ${f.name}</a>`:`<span style="color:var(--text-primary)">${f.name}</span>`}
                            ${f.detail?`<span class="checker-item-detail">${f.detail}</span>`:""}
                        </div>`).join("")}
                </div>
            </div>
        `}l+=c(n,"缺失商品","missing"),l+=c(r,"SKU缺失","sku"),l+=c(o,"编码异常","duplicate"),l+=c(i,"预售异常","inventory"),t.innerHTML=l}async function lr(e){return new Promise((a,t)=>{const n=new FileReader;n.onload=r=>{try{const o=new Uint8Array(r.target.result),i=XLSX.read(o,{type:"array"}),s=i.Sheets[i.SheetNames[0]];a(XLSX.utils.sheet_to_json(s,{header:1,defval:""}))}catch(o){t(new Error("文件解析失败: "+o.message))}},n.onerror=()=>t(new Error("文件读取失败")),n.readAsArrayBuffer(e)})}function we(e){if(!e)return"";const a=e.indexOf("「");return a!==-1?e.substring(a):e}async function cr(e){var n,r;console.log(`[新品链接] 开始写入 ${e.length} 条商品ID...`);const{error:a}=await window.supabaseClient.from("new_product_links").delete().gte("id",0);if(a)throw new Error("清空旧数据失败: "+a.message);const t=500;for(let o=0;o<e.length;o+=t){const i=e.slice(o,o+t).map(l=>({product_id:l})),{error:s}=await window.supabaseClient.from("new_product_links").insert(i);if(s)throw new Error("写入商品ID失败: "+s.message)}console.log(`[新品链接] 写入完成，共 ${e.length} 条`),(r=(n=window.AppUtils)==null?void 0:n.showToast)==null||r.call(n,`商品链接已更新，共 ${e.length} 个商品ID`,"success"),window._refreshNewProductLinks&&window._refreshNewProductLinks()}window.openProductCheckerModal=ir;async function Te(){try{const e=await window.SupabaseClient.query("quick_links",{orderBy:{column:"sort_order",ascending:!0}});dr(e||[])}catch(e){console.error('<i data-lucide="x-circle"></i> 加载快捷链接失败:',e)}}function dr(e){let a=document.getElementById("quickLinksBar");if(!a){const t=document.querySelector(".header-brand");if(!t)return;a=document.createElement("div"),a.id="quickLinksBar",a.className="quick-links-bar",t.appendChild(a)}if(e.length===0){a.innerHTML="",a.style.display="none";return}a.style.display="flex",a.innerHTML=e.map(t=>`
        <a href="${re(t.url)}" target="_blank" rel="noopener noreferrer" 
           class="quick-link-chip" title="${re(t.url)}">
            ${re(t.name)}
        </a>
    `).join("")}async function ur(){const e=document.querySelector(".ql-modal-overlay");e&&e.remove();const a=document.createElement("div");a.className="ql-modal-overlay",a.innerHTML=`
        <div class="ql-modal">
            <div class="ql-modal-header">
                <h3>导航链接管理</h3>
                <span class="ql-modal-subtitle">数据库表：quick_links</span>
                <button class="ql-modal-close" title="关闭"><i data-lucide="x"></i></button>
            </div>
            <div class="ql-modal-body">
                <!-- 添加区域 -->
                <div class="ql-add-form">
                    <div class="ql-add-row">
                        <input type="text" id="qlNewName" class="ql-input" placeholder="链接名称" maxlength="20">
                        <input type="text" id="qlNewUrl" class="ql-input ql-input-url" placeholder="网址 (https://...)" >
                        <button class="btn btn-primary ql-add-btn" id="qlAddBtn">添加</button>
                    </div>
                </div>
                <!-- 列表区域 -->
                <div class="ql-list" id="qlList">
                    <div class="ql-loading">加载中...</div>
                </div>
            </div>
        </div>
    `,document.body.appendChild(a),a.querySelector(".ql-modal-close").addEventListener("click",()=>it(a)),a.addEventListener("click",t=>{t.target===a&&it(a)}),a.querySelector("#qlAddBtn").addEventListener("click",()=>st(a)),a.querySelector("#qlNewUrl").addEventListener("keydown",t=>{t.key==="Enter"&&st(a)}),await Le(a)}function it(e){e.style.animation="fadeIn 0.2s ease reverse",setTimeout(()=>e.remove(),200)}async function Le(e){const a=e.querySelector("#qlList");try{const t=await window.SupabaseClient.query("quick_links",{orderBy:{column:"sort_order",ascending:!0}});if(!t||t.length===0){a.innerHTML='<div class="ql-empty">暂无链接，请在上方添加</div>';return}a.innerHTML=t.map((n,r)=>`
            <div class="ql-item" data-id="${n.id}">
                <span class="ql-item-order">${r+1}</span>
                <span class="ql-item-name" title="${re(n.name)}">${re(n.name)}</span>
                <a href="${re(n.url)}" target="_blank" rel="noopener noreferrer" class="ql-item-url" title="${re(n.url)}">${re(n.url)}</a>
                <div class="ql-item-actions">
                    <button class="ql-btn-sort" title="上移" onclick="moveLink(${n.id}, 'up', this)"><i data-lucide="chevron-up"></i></button>
                    <button class="ql-btn-sort" title="下移" onclick="moveLink(${n.id}, 'down', this)"><i data-lucide="chevron-down"></i></button>
                    <button class="ql-btn-del" title="删除" onclick="deleteLink(${n.id}, this)"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `).join("")}catch(t){a.innerHTML='<div class="ql-empty" style="color:var(--error-color);">加载失败</div>',console.error('<i data-lucide="x-circle"></i> 加载链接列表失败:',t)}}async function st(e){const a=e.querySelector("#qlNewName"),t=e.querySelector("#qlNewUrl"),n=a.value.trim();let r=t.value.trim();if(!n){showToast("请输入链接名称","warning"),a.focus();return}if(!r){showToast("请输入网址","warning"),t.focus();return}/^https?:\/\//i.test(r)||(r="https://"+r);try{const o=await window.SupabaseClient.query("quick_links",{orderBy:{column:"sort_order",ascending:!1},limit:1}),i=o&&o.length>0&&o[0].sort_order||0;await window.SupabaseClient.insert("quick_links",{name:n,url:r,sort_order:i+1}),showToast("链接已添加","success"),a.value="",t.value="",a.focus(),await Le(e),await Te()}catch(o){showToast("添加失败: "+o.message,"error"),console.error('<i data-lucide="x-circle"></i> 添加链接失败:',o)}}async function pr(e,a){if(confirm("确定删除此链接？"))try{await window.SupabaseClient.delete("quick_links",{id:e}),showToast("已删除","success");const t=document.querySelector(".ql-modal-overlay");t&&await Le(t),await Te()}catch(t){showToast("删除失败","error"),console.error('<i data-lucide="x-circle"></i> 删除链接失败:',t)}}async function mr(e,a,t){try{const n=await window.SupabaseClient.query("quick_links",{orderBy:{column:"sort_order",ascending:!0}});if(!n)return;const r=n.findIndex(c=>c.id===e);if(r===-1)return;const o=a==="up"?r-1:r+1;if(o<0||o>=n.length)return;const i=n[r].sort_order,s=n[o].sort_order;await window.SupabaseClient.update("quick_links",{sort_order:s},{id:n[r].id}),await window.SupabaseClient.update("quick_links",{sort_order:i},{id:n[o].id});const l=document.querySelector(".ql-modal-overlay");l&&await Le(l),await Te()}catch(n){showToast("排序失败","error"),console.error('<i data-lucide="x-circle"></i> 排序失败:',n)}}function re(e){if(!e)return"";const a=document.createElement("div");return a.textContent=e,a.innerHTML}window.loadQuickLinks=Te;window.openQuickLinksManager=ur;window.deleteLink=pr;window.moveLink=mr;window.loadInventoryAnalysisPage=function(e){return e==="inventory-analysis"?{html:gr(),init:fr}:null};function gr(){return`
        <div class="ia-wrap">

            <!-- 页面标题栏 -->
            <div class="ia-page-header">
                <div>
                    <h2><i data-lucide="package-search"></i> 库存判断</h2>
                    <p>库存周转率 &amp; SKU 动销/滞销率计算与追踪</p>
                </div>
            </div>

            <!-- ===== 模块一：库存周转率 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="refresh-ccw"></i> 库存周转率计算</span>
                    <span class="ia-card-badge">随时可算（建议每周一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映整体资金的流动性与营运效率</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“＜15天”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“15天-30天”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“＞30天”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                月度库存周转率 = <span class="ia-fraction"><span class="ia-numerator">当月商品销售总成本</span><span class="ia-denominator">当前库存总金额</span></span>
                                <br style="margin:0.4rem 0;">
                                <span style="font-size:0.85em;">周转天数 = <span class="ia-fraction" style="font-size:1em;"><span class="ia-numerator">当前库存总金额</span><span class="ia-denominator">当月商品销售总成本</span></span> × 30 （四舍五入）</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSalesCost">当月商品销售总成本</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 报表-销售主体分析</div>
                                    <div class="ia-source-tag">查询池：近一个月销售成本</div>
                                    <div class="ia-source-tag">数值为「净销售成本」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSalesCost" placeholder="0.00" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaCurrentStock">当前库存总金额</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 报表-商品库存结构分析</div>
                                    <div class="ia-source-tag">查询池：库存总金额（成本）</div>
                                    <div class="ia-source-tag">数值为「主仓实际库存金额」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaCurrentStock" placeholder="0.00" min="0" step="0.01">
                                <span class="ia-suffix">元</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaTurnoverSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaTurnoverResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaTurnoverHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaTurnoverBulkDel" title="清空所有周转率记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaTurnoverHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 周转率曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-up"></i> 周转率历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaTurnoverChartLimit" class="ia-chart-select">
                                <option value="12" selected>最近 12 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaTurnoverChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaTurnoverChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- ===== 模块二：SKU 滞销率 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="tag"></i> SKU 动销率 / 滞销率计算</span>
                    <span class="ia-card-badge">随时可算（建议小号开播前后均计算一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映选品精准度与直播间带货能力</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“滞销SKU＜20%”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“滞销SKU20%-30%”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“滞销SKU＞30%”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                动销率 = <span class="ia-fraction"><span class="ia-numerator">当月有销量的 SKU 总数</span><span class="ia-denominator">当月店铺总 SKU 数</span></span> × 100%
                                <br>
                                <span style="margin-top:0.5rem;display:block;">滞销率 = 100% − 动销率</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaActiveSku">当前有销售量的 SKU 总数</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：有销量SKU数 &gt; 5</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaActiveSku" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaTotalSku">当前店铺总 SKU 数</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：有效SKU数 &gt; 5</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaTotalSku" placeholder="0" min="1" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaSkuSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaSkuResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaSkuHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaSkuBulkDel" title="清空所有SKU记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaSkuHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 滞销率曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-down"></i> 动销率 / 滞销率历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaSkuChartLimit" class="ia-chart-select">
                                <option value="10" selected>最近 10 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaSkuChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaSkuChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- ===== 模块三：滞销/可售 SKU 统计 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="bar-chart-3"></i> 滞销/可售 SKU 统计</span>
                    <span class="ia-card-badge">随时可算（建议每周一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映新品上货库存深度、备货深度、选品精准度及定价准确度。数值越高越不好。</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“＜15%”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“15%-30%”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“＞30%”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                滞销 SKU 占比 = <span class="ia-fraction"><span class="ia-numerator">滞销 SKU 数量</span><span class="ia-denominator">可售 SKU 数量</span></span> × 100%
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSaleableSku">可售 SKU 数量</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：可售 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSaleableSku" placeholder="0" min="1" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaInactiveSku">滞销 SKU 数量</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：滞销 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「条目数」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaInactiveSku" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">个</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaSkuStockSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaSkuStockResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaSkuStockHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaSkuStockBulkDel" title="清空所有滞销/可售SKU记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaSkuStockHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 滞销占比曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-down"></i> 滞销 SKU 占比历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaSkuStockChartLimit" class="ia-chart-select">
                                <option value="10" selected>最近 10 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaSkuStockChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaSkuStockChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- ===== 模块四：滞销/可用数 统计 ===== -->
            <div class="ia-card">
                <div class="ia-card-header">
                    <span class="ia-card-title"><i data-lucide="pie-chart"></i> 滞销/可售 可用数 统计</span>
                    <span class="ia-card-badge">随时可算（建议每周一次）</span>
                    <span class="ia-card-badge ia-badge-orange">反映新品上货库存深度、备货深度、选品精准度及定价准确度。数值越高越不好。</span>
                </div>

                <div class="ia-two-col">
                    <!-- 左：输入 -->
                    <div class="ia-input-panel">
                        <div class="ia-threshold-bar">
                            <span class="ia-card-badge ia-badge-green">“＜10%”正常值</span>
                            <span class="ia-card-badge ia-badge-orange">“10%-15%”预警值</span>
                            <span class="ia-card-badge ia-badge-red">“＞15%”危险值</span>
                            <button type="button" class="ia-formula-toggle-btn" onclick="const box = this.parentElement.nextElementSibling; if(box.style.display==='none'){box.style.display='block'; this.innerHTML='隐藏公式';} else {box.style.display='none'; this.innerHTML='查看公式';}">查看公式</button>
                        </div>
                        <div class="ia-formula-box" style="display: none;">
                            <div class="ia-formula-title">计算公式</div>
                            <div class="ia-formula-content">
                                滞销可用数占比 = <span class="ia-fraction"><span class="ia-numerator">滞销可用数</span><span class="ia-denominator">可用数（总）</span></span> × 100%
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaSaleableQty">可用数（总）</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：可售 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「可用数合计」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaSaleableQty" placeholder="0" min="1" step="1">
                                <span class="ia-suffix">件</span>
                            </div>
                        </div>

                        <div class="ia-field">
                            <div class="ia-field-label-row">
                                <label for="iaInactiveQty">滞销可用数</label>
                                <div class="ia-source-tags-group">
                                    <div class="ia-source-tag">ERP 商品及库存管理</div>
                                    <div class="ia-source-tag">筛选池：滞销 SKU 数量</div>
                                    <div class="ia-source-tag">数值为「可用数合计」</div>
                                </div>
                            </div>
                            <div class="ia-input-box">
                                <input type="number" id="iaInactiveQty" placeholder="0" min="0" step="1">
                                <span class="ia-suffix">件</span>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary ia-submit-btn" id="iaQtyStockSave">
                            <i data-lucide="save"></i> 计算并保存
                        </button>
                    </div>

                    <!-- 右：结果 -->
                    <div class="ia-result-panel">
                        <div class="ia-result-card" id="iaQtyStockResult">
                            <div class="ia-result-empty">
                                <i data-lucide="bar-chart-2"></i>
                                <p>请填写左侧数据后计算</p>
                            </div>
                        </div>

                        <div class="ia-history-list" id="iaQtyStockHistory">
                            <div class="ia-history-header" style="justify-content:space-between;display:flex;">
                                <div>
                                    <i data-lucide="clock"></i> 历史记录
                                    <span class="ia-tip">（数据库：inventory_analysis）</span>
                                </div>
                                <button type="button" class="ia-bulk-del-btn" id="iaQtyStockBulkDel" title="清空所有滞销/可用数记录">
                                    <i data-lucide="trash-2"></i> 批量删除
                                </button>
                            </div>
                            <div class="ia-history-body" id="iaQtyStockHistoryBody">
                                <div class="ia-loading"><i data-lucide="loader-2"></i> 加载中...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 滞销可用数占比曲线图 -->
                <div class="ia-chart-wrap">
                    <div class="ia-chart-title">
                        <span><i data-lucide="trending-down"></i> 滞销可用数占比历史趋势</span>
                        <div class="ia-chart-controls">
                            <select id="iaQtyStockChartLimit" class="ia-chart-select">
                                <option value="10" selected>最近 10 条</option>
                                <option value="30">最近 30 条</option>
                            </select>
                            <button type="button" class="ia-chart-refresh-btn" id="iaQtyStockChartRefresh">
                                <i data-lucide="refresh-cw"></i> 刷新图表
                            </button>
                        </div>
                    </div>
                    <div class="ia-chart-container">
                        <canvas id="iaQtyStockChart"></canvas>
                    </div>
                </div>
            </div>

        </div>

        <!-- ===== 清空确认弹窗 ===== -->
        <div class="ia-modal-overlay" id="iaClearModal" style="display:none;">
            <div class="ia-modal">
                <div class="ia-modal-icon"><i data-lucide="alert-triangle"></i></div>
                <div class="ia-modal-title">确认清空数据？</div>
                <div class="ia-modal-desc">此操作将清空 <code>inventory_analysis</code> 表中的<strong>全部</strong>记录，且<strong>无法恢复</strong>。</div>
                <div class="ia-modal-actions">
                    <button type="button" class="btn btn-secondary" id="iaCancelClear">取消</button>
                    <button type="button" class="btn btn-danger" id="iaConfirmClear">确认清空</button>
                </div>
            </div>
        </div>

        <style>
            /* ======== 库存判断页面专用样式 ======== */
            .ia-wrap {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                padding: 0;
            }

            /* 页面标题栏 */
            .ia-page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .ia-page-header h2 {
                font-size: 1.25rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;
            }

            .ia-page-header p {
                font-size: 0.875rem;
                color: var(--text-muted);
            }

            .ia-clear-btn {
                flex-shrink: 0;
            }

            /* 主卡片 */
            .ia-card {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 1.5rem;
            }

            .ia-card-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.25rem;
                padding-bottom: 0.875rem;
                border-bottom: 1px solid var(--border-color);
            }

            .ia-card-title {
                font-size: 1rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.4rem;
            }

            .ia-card-badge {
                font-size: 0.72rem;
                font-weight: 500;
                padding: 0.2rem 0.6rem;
                border-radius: 999px;
                background: rgba(22, 93, 255, 0.12);
                color: var(--primary-color);
                border: 1px solid rgba(22, 93, 255, 0.25);
            }

            .ia-badge-orange {
                background: rgba(255, 125, 0, 0.1);
                color: var(--warning-color);
                border-color: rgba(255, 125, 0, 0.3);
            }

            .ia-badge-red {
                background: rgba(245, 63, 63, 0.1);
                color: var(--error-color);
                border-color: rgba(245, 63, 63, 0.3);
            }

            .ia-badge-green {
                background: rgba(0, 180, 42, 0.1);
                color: #00b42a;
                border-color: rgba(0, 180, 42, 0.3);
            }

            /* 双栏布局 */
            .ia-two-col {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                align-items: start;
            }

            /* 输入面板 */
            .ia-input-panel {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            /* 阈值栏 */
            .ia-threshold-bar {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr auto;
                gap: 0.5rem;
                margin-bottom: 1rem;
                align-items: center;
            }

            .ia-threshold-bar .ia-card-badge {
                justify-content: center;
                display: flex;
            }

            .ia-formula-toggle-btn {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                color: var(--text-secondary);
                padding: 0.35rem 0.75rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 500;
                transition: all 0.2s;
                text-align: center;
                margin-left: auto;
            }

            .ia-formula-toggle-btn:hover {
                background: rgba(22, 93, 255, 0.05);
                color: var(--primary-color);
                border-color: rgba(22, 93, 255, 0.2);
            }

            /* 公式展示框 */
            .ia-formula-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .ia-formula-title {
                font-size: 0.75rem;
                color: var(--text-muted);
                font-weight: 500;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .ia-formula-content {
                font-size: 0.875rem;
                color: var(--text-secondary);
                line-height: 1.6;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .ia-fraction {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                vertical-align: middle;
                margin: 0 0.25rem;
            }

            .ia-numerator {
                border-bottom: 1px solid var(--text-secondary);
                padding-bottom: 0.15rem;
                margin-bottom: 0.15rem;
                font-size: 0.85rem;
            }

            .ia-denominator {
                font-size: 0.78rem;
                color: var(--text-muted);
            }

            /* 字段 */
            .ia-field {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .ia-field label {
                font-size: 0.8rem;
                color: var(--text-muted);
                font-weight: 500;
            }

            .ia-optional {
                font-size: 0.72rem;
                color: var(--text-disabled);
                font-weight: 400;
                margin-left: 0.25rem;
            }

            .ia-input-box {
                display: flex;
                align-items: center;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                overflow: hidden;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .ia-input-box:focus-within {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.15);
            }

            .ia-input-box input {
                flex: 1;
                min-width: 0;
                border: none;
                background: transparent;
                padding: 0.6rem 0.75rem;
                font-size: 0.95rem;
                color: var(--text-primary);
                text-align: right;
                outline: none;
                font-variant-numeric: tabular-nums;
            }

            .ia-input-box input::placeholder {
                color: var(--text-disabled);
            }

            .ia-suffix {
                padding: 0 0.75rem;
                font-size: 0.8rem;
                color: var(--text-muted);
                white-space: nowrap;
                border-left: 1px solid var(--border-color);
                background: rgba(255, 255, 255, 0.02);
                line-height: 2.4;
            }

            .ia-field-hint {
                font-size: 0.78rem;
                color: var(--warning-color);
            }
            .ia-field-hint:empty {
                display: none;
            }

            .ia-submit-btn {
                width: 100%;
                margin-top: 0.25rem;
            }

            /* 结果面板 */
            .ia-result-panel {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .ia-result-card {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 1.25rem;
                min-height: 130px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ia-result-empty {
                text-align: center;
                color: var(--text-disabled);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
            }

            .ia-result-content {
                width: 100%;
            }

            .ia-result-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                padding: 0.4rem 0;
                border-bottom: 1px solid var(--border-color);
            }

            .ia-result-row:last-child {
                border-bottom: none;
            }

            .ia-result-label {
                font-size: 0.82rem;
                color: var(--text-muted);
            }

            .ia-result-value {
                font-size: 1rem;
                font-weight: 600;
                font-variant-numeric: tabular-nums;
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
            }

            .ia-result-value.ia-highlight {
                font-size: 1.35rem;
                color: var(--primary-color);
            }

            .ia-result-value.ia-warn {
                color: var(--warning-color);
            }

            .ia-result-value.ia-success {
                color: var(--success-color);
            }

            .ia-result-value.ia-error {
                color: var(--error-color);
            }

            /* 历史记录 */
            .ia-history-list {
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                overflow: hidden;
            }

            .ia-history-header {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                font-size: 0.82rem;
                font-weight: 600;
                color: var(--text-secondary);
                padding: 0.625rem 1rem;
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid var(--border-color);
            }

            .ia-tip {
                font-size: 0.7rem;
                color: var(--text-disabled);
                font-weight: 400;
            }

            .ia-history-body {
                max-height: 110px; /* 控制最多显示约 3 条记录，超出的滚动 */
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
            }

            .ia-history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 1rem;
                border-bottom: 1px solid var(--border-color);
                font-size: 0.82rem;
            }

            .ia-history-item:last-child {
                border-bottom: none;
            }

            .ia-history-date {
                color: var(--text-muted);
                flex-shrink: 0;
            }

            .ia-history-rate {
                font-weight: 600;
                font-variant-numeric: tabular-nums;
            }

            .ia-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 1.5rem;
                color: var(--text-muted);
                font-size: 0.85rem;
            }

            .ia-empty-tip {
                text-align: center;
                padding: 1.5rem;
                color: var(--text-disabled);
                font-size: 0.82rem;
            }

            /* 填写说明内容区--空白占位 */
            .ia-note-content {
                min-height: 1rem;
                color: var(--text-muted);
                font-size: 0.85rem;
                line-height: 1.6;
            }

            /* 字段标题水平排列容器 */
            .ia-field-label-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 0.4rem;
                gap: 0.5rem;
            }
            .ia-field-label-row label {
                margin-bottom: 0 !important;
                white-space: nowrap;
            }
            .ia-field-label-row .ia-source-tag { margin-bottom: 0 !important; }
            .ia-source-tags-group {
                display: flex;
                gap: 0.3rem;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            /* 数据来源高亮标签 */
            .ia-source-tag {
                font-size: 0.68rem;
                font-weight: 500;
                color: #ffffff;
                background: #165DFF;
                border: 1px solid #165DFF;
                border-radius: 5px;
                padding: 0.2rem 0.5rem;
                line-height: 1.4;
                text-align: right;
                margin-bottom: 0.1rem;
            }

            /* 历史记录删除按钮 */
            .ia-bulk-del-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                padding: 0.2rem 0.5rem;
                font-size: 0.75rem;
                border: 1px solid rgba(245, 63, 63, 0.3);
                background: rgba(245, 63, 63, 0.05);
                color: var(--error-color);
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .ia-bulk-del-btn:hover {
                background: var(--error-color);
                color: white;
            }
            
            .ia-bulk-del-btn svg {
                width: 13px !important;
                height: 13px !important;
            }

            .ia-del-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                border: none;
                background: transparent;
                color: var(--text-disabled);
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.15s;
                padding: 0;
                flex-shrink: 0;
            }

            .ia-del-btn:hover {
                background: rgba(245, 63, 63, 0.15);
                color: var(--error-color);
            }

            .ia-del-btn svg {
                width: 13px;
                height: 13px;
            }

            /* 曲线图 */
            .ia-chart-wrap {
                margin-top: 1.5rem;
                padding-top: 1.25rem;
                border-top: 1px solid var(--border-color);
            }

            .ia-chart-title {
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.4rem;
                margin-bottom: 1rem;
            }

            .ia-chart-title > span {
                display: flex;
                align-items: center;
                gap: 0.4rem;
            }

            .ia-chart-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                white-space: nowrap;
                flex-wrap: nowrap;
            }

            .ia-chart-select {
                font-size: 0.78rem;
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-secondary);
                outline: none;
                cursor: pointer;
            }

            .ia-chart-select:focus {
                border-color: var(--primary-color);
            }

            .ia-chart-refresh-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                font-size: 0.78rem;
                font-weight: 500;
                padding: 0.25rem 0.65rem;
                border: 1px solid rgba(22, 93, 255, 0.4);
                border-radius: 6px;
                background: rgba(22, 93, 255, 0.08);
                color: var(--primary-color);
                cursor: pointer;
                transition: all 0.2s;
            }

            .ia-chart-refresh-btn:hover {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }

            .ia-chart-refresh-btn svg {
                width: 13px;
                height: 13px;
            }

            .ia-chart-container {
                position: relative;
                height: 220px;
            }

            /* 清空弹窗 */
            .ia-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.65);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5000;
                animation: fadeIn 0.2s ease;
            }

            .ia-modal {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 14px;
                padding: 2rem 2.5rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }

            .ia-modal-icon {
                font-size: 2.5rem;
                color: var(--warning-color);
                margin-bottom: 0.75rem;
            }

            .ia-modal-title {
                font-size: 1.1rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }

            .ia-modal-desc {
                font-size: 0.875rem;
                color: var(--text-muted);
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }

            .ia-modal-desc code {
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                background: rgba(255,255,255,0.08);
                padding: 0.1em 0.4em;
                border-radius: 4px;
                color: var(--text-primary);
            }

            .ia-modal-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
            }

            /* 响应式 */
            @media (max-width: 768px) {
                .ia-two-col {
                    grid-template-columns: 1fr;
                }
                .ia-page-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.75rem;
                }
            }
        </style>
    `}function fr(){var k,v,C,I,D,M,P,h,$,A,N,q,j,K,J,Q,ae,O,V;let e=null,a=null,t=null,n=null,r=[];function o(){const x=document.getElementById("iaSalesCost"),w=document.getElementById("iaCurrentStock");x&&(x.value=""),w&&(w.value="");const E=document.getElementById("iaTurnoverSave");E&&(E.innerHTML='<i data-lucide="save"></i> 计算并保存',E.style.background="",E.style.borderColor=""),window.lucide&&window.lucide.createIcons()}async function i(x,w){if(window.supabaseClient)try{const{error:E}=await window.supabaseClient.from("inventory_analysis").delete().eq("id",x);if(E)throw E;window.showToast&&window.showToast("记录已删除","success"),w()}catch(E){console.error("删除记录失败:",E),window.showToast&&window.showToast("删除失败："+(E.message||E),"error")}}async function s(){const x=document.getElementById("iaTurnoverHistoryBody");if(x){if(!window.supabaseClient){x.innerHTML='<div class="ia-empty-tip">未连接数据库</div>';return}try{const{data:w,error:E}=await window.supabaseClient.from("inventory_analysis").select("*").eq("record_type","turnover").order("record_date",{ascending:!1}).limit(20);if(E)throw E;!w||w.length===0?x.innerHTML='<div class="ia-empty-tip">暂无历史数据</div>':(x.innerHTML=w.map(T=>{const R=T.turnover_rate!==null?Number(T.turnover_rate).toFixed(2):"--",H=T.turnover_days!==null?T.turnover_days:"--",U=T.turnover_rate!==null&&T.turnover_rate>=2?"ia-success":"ia-warn";return`<div class="ia-history-item" data-id="${T.id}">
                        <span class="ia-history-date">${T.record_date||T.record_month||"--"}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span class="ia-history-rate ${U}">${R}%</span>
                            <span style="font-size:0.78rem;color:var(--text-muted);">${H!=="--"?H+"天":""}</span>
                            <button type="button" class="ia-del-btn" data-id="${T.id}" data-type="turnover" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`}).join(""),r=w,x.querySelectorAll('.ia-del-btn[data-type="turnover"]').forEach(T=>{T.addEventListener("click",()=>i(T.dataset.id,s))})),p(w||[],l),window.updateInventoryReminder&&window.updateInventoryReminder()}catch(w){console.error("加载周转率历史失败:",w),x.innerHTML='<div class="ia-empty-tip">加载失败</div>'}}}let l=12,c=10;async function u(){const x=document.getElementById("iaSkuHistoryBody");if(x){if(!window.supabaseClient){x.innerHTML='<div class="ia-empty-tip">未连接数据库</div>';return}try{const{data:w,error:E}=await window.supabaseClient.from("inventory_analysis").select("*").eq("record_type","sku_rate").order("record_date",{ascending:!1}).limit(30);if(E)throw E;!w||w.length===0?x.innerHTML='<div class="ia-empty-tip">暂无历史数据</div>':(x.innerHTML=w.map(T=>{const R=T.active_rate!==null?Number(T.active_rate).toFixed(1):"--",H=T.inactive_rate!==null?Number(T.inactive_rate).toFixed(1):"--";return`<div class="ia-history-item" data-id="${T.id}">
                        <span class="ia-history-date">${T.record_date||"--"}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span>
                                <span class="ia-history-rate ia-success">${R}%</span>
                                <span style="color:var(--text-muted);margin:0 4px;">/</span>
                                <span class="ia-history-rate ia-error">${H}%</span>
                            </span>
                            <button type="button" class="ia-del-btn" data-id="${T.id}" data-type="sku" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`}).join(""),x.querySelectorAll('.ia-del-btn[data-type="sku"]').forEach(T=>{T.addEventListener("click",()=>i(T.dataset.id,u))})),g(w||[],c)}catch(w){console.error("加载滞销率历史失败:",w),x.innerHTML='<div class="ia-empty-tip">加载失败</div>'}}}function p(x,w){const E=document.getElementById("iaTurnoverChart");if(!E)return;const T=x.filter(z=>z.turnover_rate!==null).sort((z,F)=>(z.record_date||"").localeCompare(F.record_date||"")).slice(-(w||12)),R=T.map(z=>z.record_date||z.record_month||"--"),H=T.map(z=>Number(z.turnover_rate)),U=T.map(z=>z.turnover_days!==null?Number(z.turnover_days):null);if(e&&(e.destroy(),e=null),T.length===0){E.parentElement.innerHTML='<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';return}e=new Chart(E,{type:"line",data:{labels:R,datasets:[{label:"库存周转率（%）",data:H,borderColor:"rgba(22, 93, 255, 0.9)",backgroundColor:"rgba(22, 93, 255, 0.1)",borderWidth:2,pointBackgroundColor:"rgba(22, 93, 255, 1)",pointRadius:4,pointHoverRadius:6,fill:!0,tension:.3,yAxisID:"yRate"},{label:"周转天数（天）",data:U,borderColor:"rgba(255, 125, 0, 0.9)",backgroundColor:"rgba(255, 125, 0, 0.0)",borderWidth:2,borderDash:[4,4],pointBackgroundColor:"rgba(255, 125, 0, 1)",pointRadius:4,pointHoverRadius:6,fill:!1,tension:.3,yAxisID:"yDays"}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{labels:{color:"rgba(255,255,255,0.65)",font:{size:12},boxWidth:14}},tooltip:{backgroundColor:"rgba(23, 23, 26, 0.95)",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,titleColor:"rgba(255,255,255,0.85)",bodyColor:"rgba(255,255,255,0.7)",callbacks:{label:z=>{const F=z.parsed.y;return z.datasetIndex===0?` 周转率: ${F!==null?F.toFixed(2)+"%":"--"}`:` 周转天数: ${F!==null?F+" 天":"--"}`}}}},scales:{x:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"rgba(255,255,255,0.5)",font:{size:11}}},yRate:{type:"linear",position:"left",grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"rgba(22, 93, 255, 0.8)",font:{size:11},callback:z=>z+"%"},title:{display:!0,text:"周转率 (%)",color:"rgba(22,93,255,0.7)",font:{size:11}}},yDays:{type:"linear",position:"right",grid:{drawOnChartArea:!1},ticks:{color:"rgba(255, 125, 0, 0.8)",font:{size:11},callback:z=>z+"天"},title:{display:!0,text:"周转天数 (天)",color:"rgba(255,125,0,0.7)",font:{size:11}}}}}})}function g(x,w){const E=document.getElementById("iaSkuChart");if(!E)return;const T=[...x].sort((z,F)=>(z.record_date||"").localeCompare(F.record_date||"")).slice(-(w||10)),R=T.map(z=>z.record_date||"--"),H=T.map(z=>z.active_rate!==null?Number(z.active_rate):null),U=T.map(z=>z.inactive_rate!==null?Number(z.inactive_rate):null);if(a&&(a.destroy(),a=null),T.length===0){E.parentElement.innerHTML='<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';return}a=new Chart(E,{type:"line",data:{labels:R,datasets:[{label:"动销率（%）",data:H,borderColor:"rgba(0, 180, 42, 0.9)",backgroundColor:"rgba(0, 180, 42, 0.08)",borderWidth:2,pointBackgroundColor:"rgba(0, 180, 42, 1)",pointRadius:4,pointHoverRadius:6,fill:!1,tension:.3},{label:"滞销率（%）",data:U,borderColor:"rgba(245, 63, 63, 0.9)",backgroundColor:"rgba(245, 63, 63, 0.08)",borderWidth:2,pointBackgroundColor:"rgba(245, 63, 63, 1)",pointRadius:4,pointHoverRadius:6,fill:!1,tension:.3}]},options:m("%")})}function m(x){return{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{labels:{color:"rgba(255,255,255,0.65)",font:{size:12},boxWidth:14}},tooltip:{backgroundColor:"rgba(23, 23, 26, 0.95)",borderColor:"rgba(255,255,255,0.1)",borderWidth:1,titleColor:"rgba(255,255,255,0.85)",bodyColor:"rgba(255,255,255,0.7)",callbacks:{label:w=>` ${w.dataset.label}: ${w.parsed.y!==null?w.parsed.y.toFixed(2)+x:"--"}`}}},scales:{x:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"rgba(255,255,255,0.5)",font:{size:11}}},y:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"rgba(255,255,255,0.5)",font:{size:11},callback:w=>w+x}}}}}(k=document.getElementById("iaTurnoverSave"))==null||k.addEventListener("click",async()=>{var H,U;const x=parseFloat((H=document.getElementById("iaSalesCost"))==null?void 0:H.value),w=parseFloat((U=document.getElementById("iaCurrentStock"))==null?void 0:U.value);if(isNaN(x)||x<=0||isNaN(w)||w<0){window.showToast&&window.showToast("请正确填写当月销售总成本和当前库存总金额","warning");return}const E=x/w*100,T=Math.round(w/x*30),R=document.getElementById("iaTurnoverResult");if(R){const z=new Date,F=E>=200?"ia-success":E>=100?"ia-warn":"ia-error",W=T<=15?"ia-success":T<=30?"ia-warn":"ia-error";R.innerHTML=`<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">当月销售总成本</span>
                    <span class="ia-result-value">¥ ${x.toLocaleString("zh-CN",{minimumFractionDigits:2})}</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">当前库存总金额</span>
                    <span class="ia-result-value">¥ ${w.toLocaleString("zh-CN",{minimumFractionDigits:2})}</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">月度库存周转率</span>
                    <span class="ia-result-value ia-highlight ${F}">${E.toFixed(2)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">库存周转天数</span>
                    <span class="ia-result-value ia-highlight ${W}">${T} 天</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算日期</span>
                    <span class="ia-result-value" style="font-size:0.85rem;">${z.toLocaleDateString("zh-CN")}</span>
                </div>
            </div>`}if(!window.supabaseClient){window.showToast&&window.showToast("未连接数据库，仅显示计算结果","warning");return}try{const z=new Date,F=`${z.getFullYear()}-${String(z.getMonth()+1).padStart(2,"0")}`,Z={record_type:"turnover",record_date:z.toISOString().split("T")[0],record_month:F,sales_cost:x,current_stock:w,turnover_rate:E,turnover_days:T},{error:se}=await window.supabaseClient.from("inventory_analysis").insert(Z);if(se)throw se;window.showToast&&window.showToast("周转率数据已保存","success"),o(),s()}catch(z){console.error("保存周转率数据失败:",z),window.showToast&&window.showToast("保存失败："+(z.message||z),"error")}}),(v=document.getElementById("iaSkuSave"))==null||v.addEventListener("click",async()=>{var H,U;const x=parseInt((H=document.getElementById("iaActiveSku"))==null?void 0:H.value),w=parseInt((U=document.getElementById("iaTotalSku"))==null?void 0:U.value);if(isNaN(x)||isNaN(w)||w<=0){window.showToast&&window.showToast("请正确填写 SKU 数据，店铺总SKU数不能为0","warning");return}if(x>w){window.showToast&&window.showToast("有销售量的SKU数不能大于总SKU数","warning");return}const E=x/w*100,T=100-E,R=document.getElementById("iaSkuResult");if(R){const z=new Date,F=E>=70?"ia-success":E>=40?"ia-warn":"ia-error",W=T<=30?"ia-success":T<=60?"ia-warn":"ia-error";R.innerHTML=`<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">有销售量 SKU 数</span>
                    <span class="ia-result-value">${x} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">店铺总 SKU 数</span>
                    <span class="ia-result-value">${w} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">动销率</span>
                    <span class="ia-result-value ia-highlight ${F}">${E.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销率</span>
                    <span class="ia-result-value ia-highlight ${W}">${T.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算时间</span>
                    <span class="ia-result-value" style="font-size:0.82rem;">${z.toLocaleString("zh-CN")}</span>
                </div>
            </div>`}if(!window.supabaseClient){window.showToast&&window.showToast("未连接数据库，仅显示计算结果","warning");return}try{const F=new Date().toISOString().split("T")[0],{error:W}=await window.supabaseClient.from("inventory_analysis").insert({record_type:"sku_rate",record_date:F,active_sku_count:x,total_sku_count:w,active_rate:E,inactive_rate:T});if(W)throw W;window.showToast&&window.showToast("SKU 数据已保存","success"),u()}catch(z){console.error("保存SKU数据失败:",z),window.showToast&&window.showToast("保存失败："+(z.message||z),"error")}});const f=document.getElementById("iaClearModal");(C=document.getElementById("iaClearBtn"))==null||C.addEventListener("click",()=>{f&&(f.style.display="flex")}),(I=document.getElementById("iaCancelClear"))==null||I.addEventListener("click",()=>{f&&(f.style.display="none")}),f==null||f.addEventListener("click",x=>{x.target===f&&(f.style.display="none")}),(D=document.getElementById("iaConfirmClear"))==null||D.addEventListener("click",async()=>{if(!window.supabaseClient){window.showToast&&window.showToast("未连接数据库","error"),f&&(f.style.display="none");return}try{const{error:x}=await window.supabaseClient.from("inventory_analysis").delete().neq("id",0);if(x)throw x;window.showToast&&window.showToast("数据已全部清空","success"),f&&(f.style.display="none"),s(),u();const w=document.getElementById("iaTurnoverResult");w&&(w.innerHTML='<div class="ia-result-empty"><i data-lucide="bar-chart-2"></i><p>请填写左侧数据后计算</p></div>');const E=document.getElementById("iaSkuResult");E&&(E.innerHTML='<div class="ia-result-empty"><i data-lucide="bar-chart-2"></i><p>请填写左侧数据后计算</p></div>'),window.lucide&&window.lucide.createIcons()}catch(x){console.error("清空失败:",x),window.showToast&&window.showToast("清空失败："+(x.message||x),"error"),f&&(f.style.display="none")}}),(M=document.getElementById("iaSkuChartLimit"))==null||M.addEventListener("change",x=>{c=parseInt(x.target.value)||10,u()}),(P=document.getElementById("iaSkuChartRefresh"))==null||P.addEventListener("click",()=>{u()}),(h=document.getElementById("iaTurnoverChartLimit"))==null||h.addEventListener("change",x=>{l=parseInt(x.target.value)||12,s()}),($=document.getElementById("iaTurnoverChartRefresh"))==null||$.addEventListener("click",()=>{s()}),(A=document.getElementById("iaTurnoverBulkDel"))==null||A.addEventListener("click",async()=>{if(confirm("提示：此操作将清空“库存周转率”的所有历史记录，确认继续吗？")&&window.supabaseClient)try{const{error:x}=await window.supabaseClient.from("inventory_analysis").delete().eq("record_type","turnover");if(x)throw x;window.showToast&&window.showToast("周转率记录已清空","success"),s(),e&&(e.destroy(),e=null)}catch(x){console.error("清空失败:",x),window.showToast&&window.showToast("清空失败","error")}}),(N=document.getElementById("iaSkuBulkDel"))==null||N.addEventListener("click",async()=>{if(confirm("提示：此操作将清空“SKU动销/滞销率”的所有历史记录，确认继续吗？")&&window.supabaseClient)try{const{error:x}=await window.supabaseClient.from("inventory_analysis").delete().eq("record_type","sku_rate");if(x)throw x;window.showToast&&window.showToast("SKU记录已清空","success"),u(),a&&(a.destroy(),a=null)}catch(x){console.error("清空失败:",x),window.showToast&&window.showToast("清空失败","error")}});let L=10;async function d(){const x=document.getElementById("iaSkuStockHistoryBody");if(x){if(!window.supabaseClient){x.innerHTML='<div class="ia-empty-tip">未连接数据库</div>';return}try{const{data:w,error:E}=await window.supabaseClient.from("inventory_analysis").select("*").eq("record_type","sku_stock").order("record_date",{ascending:!1}).limit(30);if(E)throw E;!w||w.length===0?x.innerHTML='<div class="ia-empty-tip">暂无历史数据</div>':(x.innerHTML=w.map(T=>{const R=T.inactive_saleable_rate!==null?Number(T.inactive_saleable_rate).toFixed(1):"--",H=T.inactive_saleable_rate!==null?Number(T.inactive_saleable_rate):null,U=H===null?"":H<=20?"ia-success":H<=40?"ia-warn":"ia-error";return`<div class="ia-history-item" data-id="${T.id}">
                        <span class="ia-history-date">${T.record_date||"--"}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span>
                                <span style="color:var(--text-muted);font-size:0.78rem;">${T.inactive_sku_count??"--"}/${T.saleable_sku_count??"--"} 个</span>
                                <span style="margin:0 4px;color:var(--text-muted);">·</span>
                                <span class="ia-history-rate ${U}">${R}%</span>
                            </span>
                            <button type="button" class="ia-del-btn" data-id="${T.id}" data-type="sku_stock" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`}).join(""),x.querySelectorAll('.ia-del-btn[data-type="sku_stock"]').forEach(T=>{T.addEventListener("click",()=>i(T.dataset.id,d))})),y(w||[],L)}catch(w){console.error("加载滞销SKU统计历史失败:",w),x.innerHTML='<div class="ia-empty-tip">加载失败</div>'}}}function y(x,w){const E=document.getElementById("iaSkuStockChart");if(!E)return;const T=[...x].sort((U,z)=>(U.record_date||"").localeCompare(z.record_date||"")).slice(-(w||10)),R=T.map(U=>U.record_date||"--"),H=T.map(U=>U.inactive_saleable_rate!==null?Number(U.inactive_saleable_rate):null);if(t&&(t.destroy(),t=null),T.length===0){E.parentElement.innerHTML='<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';return}t=new Chart(E,{type:"line",data:{labels:R,datasets:[{label:"滞销 SKU 占比（%）",data:H,borderColor:"rgba(245, 63, 63, 0.9)",backgroundColor:"rgba(245, 63, 63, 0.1)",borderWidth:2,pointBackgroundColor:"rgba(245, 63, 63, 1)",pointRadius:4,pointHoverRadius:6,fill:!0,tension:.3}]},options:m("%")})}(q=document.getElementById("iaSkuStockSave"))==null||q.addEventListener("click",async()=>{var R,H;const x=parseInt((R=document.getElementById("iaSaleableSku"))==null?void 0:R.value),w=parseInt((H=document.getElementById("iaInactiveSku"))==null?void 0:H.value);if(isNaN(x)||x<=0){window.showToast&&window.showToast("请填写可售 SKU 数量（需大于 0）","warning");return}if(isNaN(w)||w<0){window.showToast&&window.showToast("请填写滞销 SKU 数量","warning");return}if(w>x){window.showToast&&window.showToast("滞销 SKU 数不能大于可售 SKU 数","warning");return}const E=w/x*100,T=document.getElementById("iaSkuStockResult");if(T){const U=new Date,z=E<=20?"ia-success":E<=40?"ia-warn":"ia-error";T.innerHTML=`<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">可售 SKU 数量</span>
                    <span class="ia-result-value">${x} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销 SKU 数量</span>
                    <span class="ia-result-value">${w} 个</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销 SKU 占比</span>
                    <span class="ia-result-value ia-highlight ${z}">${E.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算时间</span>
                    <span class="ia-result-value" style="font-size:0.82rem;">${U.toLocaleString("zh-CN")}</span>
                </div>
            </div>`}if(!window.supabaseClient){window.showToast&&window.showToast("未连接数据库，仅显示计算结果","warning");return}try{const z=new Date().toISOString().split("T")[0],{error:F}=await window.supabaseClient.from("inventory_analysis").insert({record_type:"sku_stock",record_date:z,saleable_sku_count:x,inactive_sku_count:w,inactive_saleable_rate:E});if(F)throw F;window.showToast&&window.showToast("滞销/可售 SKU 数据已保存","success"),d()}catch(U){console.error("保存滞销SKU数据失败:",U),window.showToast&&window.showToast("保存失败："+(U.message||U),"error")}}),(j=document.getElementById("iaSkuStockChartLimit"))==null||j.addEventListener("change",x=>{L=parseInt(x.target.value)||10,d()}),(K=document.getElementById("iaSkuStockChartRefresh"))==null||K.addEventListener("click",()=>{d()}),(J=document.getElementById("iaSkuStockBulkDel"))==null||J.addEventListener("click",async()=>{if(confirm('提示：此操作将清空"滞销/可售SKU统计"的所有历史记录，确认继续吗？')&&window.supabaseClient)try{const{error:x}=await window.supabaseClient.from("inventory_analysis").delete().eq("record_type","sku_stock");if(x)throw x;window.showToast&&window.showToast("滞销/可售SKU记录已清空","success"),d(),t&&(t.destroy(),t=null)}catch(x){console.error("清空失败:",x),window.showToast&&window.showToast("清空失败","error")}});let b=10;async function _(){const x=document.getElementById("iaQtyStockHistoryBody");if(x){if(!window.supabaseClient){x.innerHTML='<div class="ia-empty-tip">未连接数据库</div>';return}try{const{data:w,error:E}=await window.supabaseClient.from("inventory_analysis").select("*").eq("record_type","qty_stock").order("record_date",{ascending:!1}).limit(30);if(E)throw E;!w||w.length===0?x.innerHTML='<div class="ia-empty-tip">暂无历史数据</div>':(x.innerHTML=w.map(T=>{const R=T.inactive_qty_rate!==null?Number(T.inactive_qty_rate).toFixed(1):"--",H=T.inactive_qty_rate!==null?Number(T.inactive_qty_rate):null,U=H===null?"":H<=20?"ia-success":H<=40?"ia-warn":"ia-error";return`<div class="ia-history-item" data-id="${T.id}">
                        <span class="ia-history-date">${T.record_date||"--"}</span>
                        <span style="display:flex;align-items:center;gap:0.5rem;">
                            <span>
                                <span style="color:var(--text-muted);font-size:0.78rem;">${T.inactive_qty??"--"}/${T.saleable_qty??"--"} 件</span>
                                <span style="margin:0 4px;color:var(--text-muted);">·</span>
                                <span class="ia-history-rate ${U}">${R}%</span>
                            </span>
                            <button type="button" class="ia-del-btn" data-id="${T.id}" data-type="qty_stock" title="删除此记录">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </span>
                    </div>`}).join(""),x.querySelectorAll('.ia-del-btn[data-type="qty_stock"]').forEach(T=>{T.addEventListener("click",()=>i(T.dataset.id,_))})),S(w||[],b)}catch(w){console.error("加载可用数统计历史失败:",w),x.innerHTML='<div class="ia-empty-tip">加载失败</div>'}}}function S(x,w){const E=document.getElementById("iaQtyStockChart");if(!E)return;const T=[...x].sort((U,z)=>(U.record_date||"").localeCompare(z.record_date||"")).slice(-(w||10)),R=T.map(U=>U.record_date||"--"),H=T.map(U=>U.inactive_qty_rate!==null?Number(U.inactive_qty_rate):null);if(n&&(n.destroy(),n=null),T.length===0){E.parentElement.innerHTML='<div class="ia-empty-tip" style="padding:2rem;">暂无图表数据</div>';return}n=new Chart(E,{type:"line",data:{labels:R,datasets:[{label:"滞销可用数占比（%）",data:H,borderColor:"rgba(245, 63, 63, 0.9)",backgroundColor:"rgba(245, 63, 63, 0.1)",borderWidth:2,pointBackgroundColor:"rgba(245, 63, 63, 1)",pointRadius:4,pointHoverRadius:6,fill:!0,tension:.3}]},options:m("%")})}(Q=document.getElementById("iaQtyStockSave"))==null||Q.addEventListener("click",async()=>{var R,H;const x=parseInt((R=document.getElementById("iaSaleableQty"))==null?void 0:R.value),w=parseInt((H=document.getElementById("iaInactiveQty"))==null?void 0:H.value);if(isNaN(x)||x<=0){window.showToast&&window.showToast("请填写可用数（需大于 0）","warning");return}if(isNaN(w)||w<0){window.showToast&&window.showToast("请填写滞销可用数","warning");return}if(w>x){window.showToast&&window.showToast("滞销可用数不能大于可用数总量","warning");return}const E=w/x*100,T=document.getElementById("iaQtyStockResult");if(T){const U=new Date,z=E<=20?"ia-success":E<=40?"ia-warn":"ia-error";T.innerHTML=`<div class="ia-result-content">
                <div class="ia-result-row">
                    <span class="ia-result-label">可用数（总）</span>
                    <span class="ia-result-value">${x} 件</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销可用数</span>
                    <span class="ia-result-value">${w} 件</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">滞销可用数占比</span>
                    <span class="ia-result-value ia-highlight ${z}">${E.toFixed(1)}%</span>
                </div>
                <div class="ia-result-row">
                    <span class="ia-result-label">计算时间</span>
                    <span class="ia-result-value" style="font-size:0.82rem;">${U.toLocaleString("zh-CN")}</span>
                </div>
            </div>`}if(!window.supabaseClient){window.showToast&&window.showToast("未连接数据库，仅显示计算结果","warning");return}try{const z=new Date().toISOString().split("T")[0],{error:F}=await window.supabaseClient.from("inventory_analysis").insert({record_type:"qty_stock",record_date:z,saleable_qty:x,inactive_qty:w,inactive_qty_rate:E});if(F)throw F;window.showToast&&window.showToast("滞销/可用数数据已保存","success"),_()}catch(U){console.error("保存可用数数据失败:",U),window.showToast&&window.showToast("保存失败："+(U.message||U),"error")}}),(ae=document.getElementById("iaQtyStockChartLimit"))==null||ae.addEventListener("change",x=>{b=parseInt(x.target.value)||10,_()}),(O=document.getElementById("iaQtyStockChartRefresh"))==null||O.addEventListener("click",()=>{_()}),(V=document.getElementById("iaQtyStockBulkDel"))==null||V.addEventListener("click",async()=>{if(confirm("提示：此操作将清空「滞销/可用数统计」的所有历史记录，确认继续吗？")&&window.supabaseClient)try{const{error:x}=await window.supabaseClient.from("inventory_analysis").delete().eq("record_type","qty_stock");if(x)throw x;window.showToast&&window.showToast("滞销/可用数记录已清空","success"),_(),n&&(n.destroy(),n=null)}catch(x){console.error("清空失败:",x),window.showToast&&window.showToast("清空失败","error")}});function B(x,w=30){if(window.Chart){x();return}if(w<=0){console.warn("Chart.js 未加载"),x();return}setTimeout(()=>B(x,w-1),100)}B(()=>{s(),u(),d(),_()})}window.XLSX=Bt;window.supabase={createClient:Mt};window.lucide={createIcons:function(e){At({icons:Dt,...e||{}})}};window.Chart=lt;
