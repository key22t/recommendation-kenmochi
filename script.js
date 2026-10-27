//Cloudeflare WorkerのURL
const API_BASE_URL="https://recommendation-api.teratera09-0827.workers.dev"

let videos=[];

let selectedCategory="";
let selectedVideos=[];
let selectedYear="";

let yearSelections={};
let recommendationComments={};

let maxSelectedVideos=2;

//カテゴリ設定
const categories={
    year:{
        name:"年代",
        required:true,
        options:["2018","2019","2020","2021","2022","2023","2024","2025","2026"]
    }
};

//動画データ読み込み
async function loadVideos(){
    const response=await fetch("videos.json");
    videos=await response.json();
}

//ジャンルボタン
document
    .getElementById("year-category")
    .addEventListener("click",()=>{
        selectYearCategory();
    });

//ショート除外ボタン
document
    .getElementById("exclude-shorts")
    .addEventListener("change",()=>{
        if(selectedYear!==""){
            showVideosByYear(selectedYear);
        }
    });

//年代カテゴリを選択
function selectYearCategory(){
    selectedCategory="year";

    const yearOptions=document.getElementById("year-options");

    //既に表示されていたら閉じる
    if(!yearOptions.classList.contains("hidden")){
        yearOptions.classList.add("hidden");
        return;
    }

    //年ボタンを作る
    yearOptions.innerHTML="";

    categories.year.options.forEach(year=>{
        const button=document.createElement("button");

        button.textContent=`${year}年`;
        button.addEventListener("click",()=>{

            //現在の年の選択状態を保存
            if(selectedYear !== ""){
                yearSelections[selectedYear]=[...selectedVideos];
            }

            selectedYear=year;

            //新しく開く年の選択状態を読み込む
            selectedVideos=yearSelections[year]
                ?[...yearSelections[year]]
                :[];
            
            showVideosByYear(year);
        });

        yearOptions.appendChild(button);
    });

    yearOptions.classList.remove("hidden")
}

//年代の動画を表示
function showVideosByYear(year){
    const videoSelection=document.getElementById("video-selection");
    const videoList=document.getElementById("video-list");
    const selectionTitle=document.getElementById("selection-title");

    selectionTitle.textContent=`${year}年のおすすめ動画`;

    videoList.innerHTML="";

    //ショート動画を除く
    const excludeShorts=document.getElementById("exclude-shorts").checked;

    //年代カテゴリは全年度を対象にする
    const targetVideos=videos.filter(video=>{
        const videoYear=video.publishedAt.slice(0,4);

        if(videoYear!==year){
            return false;
        }

        if(excludeShorts && video.genre==="ショート"){
            return false;
        }

        return true;
    });

    targetVideos.forEach(video=>{
        const card=document.createElement("div");

        card.className="video-card";

        if(
            selectedVideos.some(
                selectedVideo=>selectedVideo.videoId===video.videoId
            )
        ){
            card.classList.add("selected");
        }

        card.innerHTML=`
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="video-info">
                <h4>${video.title}</h4>
                <p>
                    ${video.publishedAt.slice(0,10)}
                </p>
            </div>
        `;

        card.addEventListener("click",()=>{
            toggleVideoSelection(video,card);
        });

        videoList.appendChild(card);

    });

    videoSelection.classList.remove("hidden");

    updateSelectionCount();
}

//動画を選択/選択解除
function toggleVideoSelection(video,card){
    const index=
    selectedVideos.findIndex(
        selectedVideo=>selectedVideo.videoId==video.videoId
    );

    //既に選択されている場合
    if(index !== -1){
        selectedVideos.splice(index,1);
        delete recommendationComments[video.videoId];
        card.classList.remove("selected");
    }
    //まだ選択されていない場合
    else{
        if(selectedVideos.length>=maxSelectedVideos){
            return;
        }

        selectedVideos.push(video);

        if(!recommendationComments[video.videoId]){
            recommendationComments[video.videoId]="";
        }

        card.classList.add("selected");
    }

    updateSelectionCount();
}

//選択数を更新
function updateSelectionCount(){
    const count=document.getElementById("selection-count");
    count.textContent=`選択:${selectedVideos.length}/${maxSelectedVideos}本`;
    const previewButtonTop=document.getElementById("preview-button-top");
    const previewButtonBottom=document.getElementById("preview-button-bottom");
    previewButtonTop.disabled=selectedVideos.length===0;
    previewButtonBottom.disabled=selectedVideos.length===0;
}

//選択した動画のプレビューを表示
function showPreview(){
    //現在選択中の年の選択内容を保存
    if(selectedYear!==""){
        yearSelections[selectedYear]=[...selectedVideos];
    }

    const videoSelection=document.getElementById("video-selection");
    const previewScreen=document.getElementById("preview-screen");
    const selectedVideoList=document.getElementById("selected-video-list");

    selectedVideoList.innerHTML="";

    //年代順に並べる
    Object.entries(yearSelections)
        .sort(([yearA],[yearB])=>{
            return Number(yearA)-Number(yearB);
        })
        .forEach(([year,yearVideos])=>{
            //選択動画がない年は表示しない
            if(yearVideos.length===0){
                return;
            }
            //年の見出し
            const yearTitle=document.createElement("h3");
            yearTitle.textContent=`${year}年`;

            selectedVideoList.appendChild(yearTitle);

            //その年の動画
            yearVideos.forEach(video=>{
                const card=document.createElement("div");
                card.className="preview-video";
                card.innerHTML=`
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <div class="preview-video-info">
                        <h4>${video.title}</h4>
                        <p>${video.publishedAt.slice(0,10)}</p>
                        <label>おすすめポイント</label>
                        <textarea
                            class="recommendation-comment"
                            data-video-id="${video.videoId}"
                            placeholder="この動画のおすすめポイントがあれば書いてください"
                            >${recommendationComments[video.videoId]||""}</textarea>
                    </div>
                    `;
                selectedVideoList.appendChild(card);
                    
                const commentInput=card.querySelector(".recommendation-comment");

                commentInput.addEventListener("input",()=>{
                    recommendationComments[video.videoId]=commentInput.value;
                });
            });
        });

    videoSelection.classList.add("hidden");
    previewScreen.classList.remove("hidden");
}

//選択画面に戻るボタン
document
    .getElementById("back-to-selection-button")
    .addEventListener("click",()=>{
        document
            .getElementById("preview-screen")
            .classList.add("hidden");

        document
            .getElementById("video-selection")
            .classList.remove("hidden");
    })

//選択した動画を確認
document
    .getElementById("preview-button-top")
    .addEventListener("click", ()=>{
        showPreview();
    });

document
    .getElementById("preview-button-bottom")
    .addEventListener("click", ()=>{
        showPreview();
    });

//完成画面
function showResult(){
    //最後に選択していた年の内容を保存
    if(selectedYear !== ""){
        yearSelections[selectedYear]=[...selectedVideos];
    }
    const createScreen=document.getElementById("create-screen");
    const previewScreen=document.getElementById("preview-screen");
    const resultScreen=document.getElementById("result-screen");
    const result=document.getElementById("result");
    
    result.innerHTML="";

    //タイトル
    const title=document.createElement("h3");
    title.textContent="おすすめけんもち";

    result.appendChild(title);

    //SNS共有ボタン
    const shareButton=document.createElement("button");

    shareButton.id="share-button";
    shareButton.textContent="SNSで共有する";

    //ボタンを結果画面の先頭に追加
    result.appendChild(shareButton);

    //ボタンのイベント
    shareButton.addEventListener("click",()=>{
        shareRecommendation();
    });

    //年代順に表示
    Object.entries(yearSelections)
        .sort(([yearA],[yearB])=>{
            return Number(yearA)-Number(yearB);
        })
        .forEach(([year,yearvideos])=>{
            if(yearvideos.length===0){
                return;
        }
        const yearSection=document.createElement("section");

        const yearTitle=document.createElement("h4");
        yearTitle.textContent=`${year}年`;

        yearSection.appendChild(yearTitle);

        yearvideos.forEach(video=>{
            const item=document.createElement("div");

            item.className="result-video";

            const comment=recommendationComments[video.videoId]||"";

            item.innerHTML=`
                <img src="${video.thumbnail}" alt="${video.title}">
                <h4>${video.title}</h4>
                ${comment ? `<p>${comment}</p>`:""}
            `;

            //動画クリック時の処理
            item.addEventListener("click",()=>{
                playVideo(video.videoId);
            });
            
            yearSection.appendChild(item);
        });

        result.appendChild(yearSection);
    
    });

    createScreen.classList.add("hidden");
    previewScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");
}

//新しいおすすめを作成
function startNewReccomendation(){
    //選択内容とコメントをリセット
    yearSelections={};
    selectedVideos=[];
    selectedYear="";
    selectedCategory="";
    recommendationComments={};

    //年代選択欄を閉じる
    document
        .getElementById("year-options")
        .classList.add("hidden");

    //動画選択画面を隠す
    document
        .getElementById("video-selection")
        .classList.add("hidden");

    //プレビュー画面を隠す
    document
        .getElementById("preview-screen")
        .classList.add("hidden");

    //完成画面を隠す
    document
        .getElementById("result-screen")
        .classList.add("hidden");

    //共有画面を隠す
    document
        .getElementById("shared-screen")
        .classList.add("hidden");
        
    //選択肢をリセット
    document
        .getElementById("selection-count")
        .textContent=`選択：0/${maxSelectedVideos}本`;
    
    //プレビューボタンを無効化
    document
        .getElementById("preview-button-top")
        .disabled=true;
    
    document
        .getElementById("preview-button-bottom")
        .disabled=true;
    
    //ショート除外のチェックを解除
    document
        .getElementById("exclude-shorts")
        .checked=false;
    
    //作成画面を表示
    document
        .getElementById("create-screen")
        .classList.remove("hidden");

}

//動画を再生する
function playVideo(videoId){
    window.open(`https://www.youtube.com/watch?v=${videoId}`,"_blank");
}

//共有画面
function showSharedResult(sharedData){
    const sharedScreen=document.getElementById("shared-screen");
    const sharedResult=document.getElementById("shared-result");

    sharedResult.innerHTML="";

    //年代順に表示
    Object.entries(sharedData)
        .sort(([yearA],[yearB])=>{
            return Number(yearA)-Number(yearB);
        })
        .forEach(([year,yearVideos])=>{
            if(yearVideos.length===0){
                return;
            }
            
            const yearSection=document.createElement("section");

            const yearTitle=document.createElement("h3");
            yearTitle.textContent=`${year}年`;

            yearSection.appendChild(yearTitle);

            yearVideos.forEach(sharedVideo=>{
                const video=videos.find(
                    item=>item.videoId===sharedVideo.videoId
                );

                //動画情報が見つからない場合は表示しない
                if(!video){
                    return;
                }

                const item=document.createElement("div");
                item.className="result-video";

                const title=document.createElement("h4");
                title.textContent=video.title;

                const thumbnail=document.createElement("img");
                thumbnail.src=video.thumbnail;
                thumbnail.alt=video.title;

                item.appendChild(thumbnail);
                item.appendChild(title);

                //オススメコメントがある場合のみ表示
                if(sharedVideo.comment){
                    const comment=document.createElement("p");
                    comment.textContent=sharedVideo.comment;

                    item.appendChild(comment);
                }

                item.addEventListener("click",()=>{
                    playVideo(video.videoId);
                });

                yearSection.appendChild(item);

            });

            sharedResult.appendChild(yearSection);

        });

    //作成画面・プレビュー画面・完成画面を隠す
    document.getElementById("create-screen").classList.add("hidden");
    document.getElementById("preview-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.add("hidden");

    //共有閲覧画面を表示
    sharedScreen.classList.remove("hidden");

}

//完成ボタン
document
    .getElementById("complete-button")
    .addEventListener("click",()=>{
        showResult();
    });

//戻るボタン
document
    .getElementById("back-button")
    .addEventListener("click",()=>{
        startNewReccomendation();
    });

//共有画面から自分も作成する
document
    .getElementById("make-your-own-button")
    .addEventListener("click",()=>{
        startNewReccomendation();
    });

//おすすめデータを保存し、共有URLを作成する
async function shareRecommendation(){
    //選択中の年の内容を保存
    if(selectedYear !== ""){
        yearSelections[selectedYear]=[...selectedVideos];
    }

    //共有用データを作成
    const sharedData={};

    Object.entries(yearSelections).forEach(([year,yearVideos])=>{
        if(yearVideos.length===0){
            return;
        }
        sharedData[year]=yearVideos.map(video=>({
            videoId: video.videoId,
            comment: recommendationComments[video.videoId] || ""
        }));
    });
    if(Object.keys(sharedData).length===0){
        alert("共有する動画がありません。");
        return;
    }
    const shareButton=document.getElementById("share-button");
    shareButton.disabled=true;

    try{
        //Workerへ保存リクエストを送信
        const response=await fetch(
            `${API_BASE_URL}/api/recommendations`,
            {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(sharedData)
            }
        );

        if(!response.ok){
            throw new Error(`保存に失敗しました：${response.status}`);
        }

        const result=await response.json();

        if(!result.id){
            throw new Error("共有IDを取得できませんでした。");
        }

        //現在のページURLに共有IDを付ける
        const shareURL=new URL(window.location.href);
        shareURL.search="";
        shareURL.hash="";
        shareURL.searchParams.set("id",result.id);

        //共有URLを表示
        let shareArea=document.getElementById("share-url-area");

        if(!shareArea){
            shareArea=document.createElement("div");
            shareArea.id="share-url-area";
            shareButton.insertAdjacentElement("afterend",shareArea);
        }

        shareArea.replaceChildren();

        const message=document.createElement("p");
        message.textContent="共有URLを作成しました！";
        
        const urlInput=document.createElement("input");
        urlInput.type="text";
        urlInput.value=shareURL.href;
        urlInput.readOnly=true;
        urlInput.setAttribute("aria-lebel","共有URL");

        const copyButton=document.createElement("button");
        copyButton.type="button";
        copyButton.teztContent="URLをコピー";

        copyButton.addEventListener("click",async()=>{
            try{
                await navigator.clipboard.whiteText(shareURL.href);
                copyButton.textContent="コピーしました！";
            }catch(error){
                urlInput.focus();
                urlInput.select();

                const copied=document.ececCommand("copy");
                copyButton.textContent=copied
                    ? "コピーしました！"
                    : "URLを選択してコピーしてください";
            }
        });

        const guide=document.createElement("p");
        guide.teztContent="コピーしたURLを、SNS等で共有できます。";

        shareArea.append(message,urlInput,copyButton,guide);
    }catch(error){
        console.error("共有URLの作成に失敗しました",error);
        alert("共有URLを作成できませんでした。\n友進環境やWorkerの設定を確認してください。");
    }finally{
        shareButton.disabled=false;
    }
}

//共有URLからおすすめを読み込む
async function loadSharedRecommendation(){
    //URLから共有IDを取得
    const params=new URLSearchParams(window.location.search);
    const id=params.get("id");

    //共有IDがなければ何もしない
    if(!id){
        return;
    }

    //共有IDの形式を確認
    if(!/^[a-f0-9]{32}$/.test(id)){
        alert("共有URLが正しくありません。");
        return;
    }

    try{
        //Workerから共有データを取得
        const response=await fetch(
            `${API_BASE_URL}/api/recommendations/${id}`
        );

        if(!response.ok){
            throw new Error("共有データを取得できませんでした。");
        }

        const sharedData=await response.json();

        //取得したおすすめを表示
        showSharedResult(sharedData);
    }catch(error){
        console.error("共有データの読み込みに失敗しました。",error);
        alert("おすすめを読み込めませんでした。共有URLを確認してください。");
    }
}

//初期化
async function initializeApp(){
    await loadVideos();
    await loadSharedRecommendation();
}

initializeApp();