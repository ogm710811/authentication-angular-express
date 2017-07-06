import { AngularAuthPage } from './app.po';

describe('angular-auth App', () => {
  let page: AngularAuthPage;

  beforeEach(() => {
    page = new AngularAuthPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
