import React, { Component, createRef, Fragment } from 'react';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import SearchIcon from '@material-ui/icons/Search';
import CircularProgress from '@material-ui/core/CircularProgress';
import { fromEvent } from 'rxjs';
import { map, mergeMap, debounceTime, distinctUntilChanged, tap, partition } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';

const styles = (theme) => ({
  root: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    width: 400,
    margin: '16px auto 0 auto',
    color: theme.palette.text.secondary,
  },
  search: {
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    marginLeft: 8,
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    width: 1,
    height: 28,
    margin: 4,
  },
  list: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  progress: {
    margin: `${theme.spacing.unit * 2 }px auto`,
  },
  gitIcon: {
    width: 48,
    height: 48,
    position: 'absolute',
    right: 24,
    padding: 12,
  }
});

class Index extends Component<any> {
  searchRef = createRef();
  keyup$;
  user$;
  state = {
    isLoading: false,
    userList: []
  };

  componentDidMount() {
    // search input event handler
    this.keyup$ = fromEvent(this.searchRef.current as any, 'keyup')
      .pipe(
        debounceTime(300),
        map((event: React.ChangeEvent<HTMLInputElement>) => event.target.value),
        distinctUntilChanged(),
      );

    // partition reset or rendering by search value
    let [user$, reset$] = this.keyup$
      .pipe(
        partition((query: string) => query.trim().length > 0),
      );

    // should return json data after api call
    this.user$ = user$
      .pipe(
        tap(this.showLoading),
        mergeMap((query: string) => ajax.getJSON(`https://api.github.com/search/users?q=${query}`)),
        tap(this.hideLoading),
      );

    // subscribe date to ui rendering
    this.user$.subscribe({
      next: userList => this.setState({
        userList: userList.items.length > 0 ? this.userListItem(userList.items) : this.userNoItem()
      }),
      error: (error: Error) => {
        console.error(error);
        alert(error.message);
      }
    });

    // search value reset
    reset$
      .pipe(
        tap(() => this.setState({
          userList: []
        })),
        tap(v => console.log('from reset$', v))
      )
      .subscribe();
  }

  componentWillUnmount() {
    this.user$.unsubscribe();
  }

  userListItem = (items) => items.map(user => (
    <ListItem key={user.id} alignItems='flex-start'>
      <ListItemAvatar>
        <Avatar alt='Remy Sharp' src={user.avatar_url} />
      </ListItemAvatar>
      <ListItemText primary={user.login}/>
    </ListItem>
  ));

  userNoItem = () => (
    <ListItem alignItems='center'>
      <ListItemText primary='No User'/>
    </ListItem>
  );

  showLoading = () => {
    this.setState({
      isLoading: true
    })
  };

  hideLoading = () => {
    this.setState({
      isLoading: false
    })
  };

  render() {
    const classes = styles(this.props.pageContext.theme);

    return (
      <Fragment>
        <AppBar position='static'>
          <Toolbar>
            <Typography variant='h6' color='inherit'>
              Github User Search UI
            </Typography>
            <a style={classes.gitIcon as React.CSSProperties}
               href='https://github.com/chudee/github-search-ui-next-with-rxjs'
               aria-label='GitHub repository'
               data-ga-event-category='AppBar'
               data-ga-event-action='github'
            >
                <svg fill={'#fff'} focusable='false' viewBox='0 0 24 24' aria-hidden='true' role='presentation'>
                  <path d='M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3'/>
                </svg>
            </a>
          </Toolbar>
        </AppBar>
        <Paper style={classes.root as React.CSSProperties} elevation={1}>

          <Grid container>
            <Grid item xs={12} style={classes.search as React.CSSProperties}>
              <InputBase
                inputRef={this.searchRef}
                style={classes.input}
                placeholder='Search Github User Profile'
              />
              <IconButton style={classes.iconButton} aria-label='Search'>
                <SearchIcon />
              </IconButton>
            </Grid>
            <Grid item xs={12}>
              <List style={classes.list}>
                {this.state.isLoading
                  ? <CircularProgress style={classes.progress}/>
                  : this.state.userList
                }
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Fragment>
    );
  }
}

export default Index;