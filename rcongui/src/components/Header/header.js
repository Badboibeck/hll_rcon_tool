import React from "react";
import "react-toastify/dist/ReactToastify.css";
import Grid from "@material-ui/core/Grid";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Link from "@material-ui/core/Link";
import { Link as RouterLink } from "react-router-dom";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Checkbox from "@material-ui/core/Checkbox";
import Brightness4OutlinedIcon from "@material-ui/icons/Brightness4Outlined";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import ServerStatus from "./serverStatus";
import {
  postData,
  showResponse,
  get,
  handle_http_errors,
} from "../../utils/fetchUtils";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { throttle } from "lodash/function";

const LoginModal = ({
  open,
  password,
  username,
  handleClose,
  setPassword,
  setUsername,
  login,
}) => (
  <Dialog open={open} aria-labelledby="form-dialog-title">
    <DialogTitle id="form-dialog-title">Moderator login</DialogTitle>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login();
      }}
    >
      <DialogContent>
        <Grid container spacing={1}>
          <Grid item>
            <TextField
              autoFocus
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              label="Username"
              variant="standard"
            />

            <TextField
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              inputProps={{ type: "password" }}
              variant="standard"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          cancel
        </Button>
        <Button type="submit" color="primary">
          login
        </Button>
      </DialogActions>
    </form>
  </Dialog>
);

class LoginBox extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      open: false,
      isLoggedIn: false,
      interval: null,
    };

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.isLoggedIn = this.isLoggedIn.bind(this);
  }

  componentDidMount() {
    const f = throttle(this.isLoggedIn, 1000 * 55);
    this.isLoggedIn();
    this.setState({
      interval: setInterval(f, 1000 * 60),
    });
  }

  componentWillMount() {
    clearInterval(this.state.interval);
  }

  isLoggedIn() {
    return get("is_logged_in")
      .then((response) => response.json())
      .then((res) => this.setState({ isLoggedIn: res.result }))
      .catch(handle_http_errors);
  }

  login() {
    return postData(`${process.env.REACT_APP_API_URL}login`, {
      username: this.state.username,
      password: this.state.password,
    })
      .then((res) => showResponse(res, `login ${this.state.username}`, true))
      .then((data) => {
        if (data.failed === false) {
          this.setState({ isLoggedIn: true, open: false, password: "" });
        }
      })
      .catch(handle_http_errors);
  }

  logout() {
    return get("logout")
      .then(this.setState({ isLoggedIn: false }))
      .catch(handle_http_errors);
  }

  render() {
    const { open, username, password, isLoggedIn } = this.state;
    const { classes, component } = this.props;

    return <React.Fragment><Link
      variant="button"
      color="inherit"
      className={classes.link}
      component={RouterLink}
      onClick={() => isLoggedIn === true ? this.logout() : this.setState({ open: true })}
    >
      {isLoggedIn === true ? "Logout" : "Login"}
    </Link>
    <LoginModal
        open={open}
        handleClose={() => this.setState({ open: false })}
        login={this.login}
        password={password}
        setPassword={(password) => this.setState({ password: password })}
        username={username}
        setUsername={(username) => this.setState({ username: username })}
      />
    </React.Fragment>
  }
}

// TODO: Make this reactive, it's causing the view on mobile to be bigger then it should
export default ({ classes, setSaveDark, dark }) => {
  return (
    <Grid container className={classes.grow}>
      <div className={classes.grow}>
        <AppBar position="static" elevation={0} className={classes.appBar}>
          <Toolbar className={classes.toolbar}>
            <Grid container>
              <Grid item xs={12}>
                <Grid container alignContent="flex-start" alignItems="center">
                  <Grid item>
                    <ServerStatus classes={classes} />
                  </Grid>
                  <Grid item className={classes.doublePaddingLeft}></Grid>
                  <Grid item className={classes.doublePaddingLeft}>
                    <nav className={classes.title}>
                      <Link
                        variant="button"
                        color="inherit"
                        className={classes.firstLink}
                        component={RouterLink}
                        to="/"
                      >
                        Live
                      </Link>
                      <Link
                        variant="button"
                        color="inherit"
                        className={classes.link}
                        component={RouterLink}
                        to="/history"
                      >
                        History
                      </Link>
                      <Link
                        variant="button"
                        color="inherit"
                        className={classes.link}
                        component={RouterLink}
                        to="/stats"
                      >
                        Stats
                      </Link>
                      <Link
                        variant="button"
                        color="inherit"
                        className={classes.link}
                        component={RouterLink}
                        to="/settings"
                      >
                        Settings
                      </Link>
                      <LoginBox classes={classes} component={RouterLink} />
                      <Checkbox
                        icon={<Brightness4Icon />}
                        checkedIcon={<Brightness4OutlinedIcon />}
                        checked={dark == "dark"}
                        color="default"
                        onChange={(e, checked) =>
                          setSaveDark(checked ? "dark" : "light")
                        }
                      />
                    </nav>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
      </div>
    </Grid>
  );
};
