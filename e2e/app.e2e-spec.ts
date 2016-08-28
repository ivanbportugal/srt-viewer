import { SubtitlesPage } from './app.po';

describe('subtitles App', function() {
  let page: SubtitlesPage;

  beforeEach(() => {
    page = new SubtitlesPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
