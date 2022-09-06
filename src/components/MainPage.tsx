function MainPage() {
  return (
    <div className="jumbotron f-16 mt-3">
      <h1 className="display-3">TTV Rechat</h1>
      <div className="col-12 border border-primary rounded-pill shadow py-2 mt-3">
        https://www.twitch<strong>gg</strong>.tv/videos/12345678
      </div>
      <hr className="my-4"></hr>
      <p>
        Insert "<strong>gg</strong>" after the word "twitch" in the link to
        replay chats by streamers from Twitch streams.
      </p>
      <p lang="ko">
        트위치 다시보기 링크의 "twitch" 뒤에 "<strong>gg</strong>"를 삽입하면
        스트리머의 채팅을 모아볼 수 있습니다.
      </p>
      <a
        className="btn btn-primary btn-lg"
        href="https://twgg.notion.site/Rechat-63ee83dd92384963a162895ac2553f70"
        target="_blank"
        rel="noopener noreferrer"
        role="button"
      >
        Info
      </a>
    </div>
  );
}

export default MainPage;
