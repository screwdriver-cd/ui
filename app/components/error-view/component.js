import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import Component from '@ember/component';

@tagName('')
@classic
export default class ErrorView extends Component {
  statusCode = 404;

  statusMessage = 'Page Not Found';

  errorMessage = '';
}
