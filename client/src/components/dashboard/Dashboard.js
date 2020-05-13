import React, { Component } from "react";
import PlaidLinkButton from "react-plaid-link-button";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import { getAccounts, addAccount } from "../../actions/accountActions";

import Accounts from './Accounts';

class Dashboard extends Component {
  componentDidMount() {
    this.props.getAccounts();
  }

  onLogoutClick = e => {
    e.preventDefault();
    this.props.logoutUser();
  };

  // Add account
  handleOnSuccess = (token, metadata) => {
    const plaidData = {
      public_token: token,
      metadata: metadata
    };

    this.props.addAccount(plaidData);
  }

  render() {
    const { user } = this.props.auth;
    const { accounts, accountsLoading } = this.props.plaid;

    let dashboardContent;

    if (accounts === null || accountsLoading) {
      dashboardContent = <p className="center-align">Loading...</p>;
    } else if (accounts.length > 0) {
      // User has accounts linked
      dashboardContent = <Accounts user={user} accounts={accounts} />
    } else {
      // User has no accounts linked
      dashboardContent = (
        <div className="row">
          <div className = "col s12 center-align">
            <h4>
              <b>Welcome,</b> {user.name.split(' ')[0]}
            </h4>
            <p className="flow-text grey-text text-darken-1">To get started, link your first bank account below</p>
            <div>
              <PlaidLinkButton 
                buttonProps={{
                  className: "btn btn-large waves-effect waves-light hoverable blue accent-3 main-btn"
                }}
                plaidLinkProps={{
                  clientName: "Mern-plaid",
                  key: '6071aee79b72c56fde5966240b05de',
                  env: "development",
                  product: ["transactions"],
                  onSuccess: this.handleOnSuccess
                }}
                key={{}}
                onScriptLoad={() => this.setState({ loaded: true })}
              >
                Link Account 
              </PlaidLinkButton>
            </div>
            <button
              onClick={this.onLogoutClick}
              className="btn btn-large waves-effect waves-light hoverable red accent-3 main-btn"
            >
              Logout
            </button>
          </div>
        </div>
      )
    }

    return <div className="container">{dashboardContent}</div>;
    // return (
    //   <div style={{ height: "75vh" }} className="container valign-wrapper">
    //     <div className="row">
    //       <div className="landing-copy col s12 center-align">
    //         <h4>
    //           <b>Hey there,</b> {user.name.split(" ")[0]}
    //           <p className="flow-text grey-text text-darken-1">
    //             You are logged into a full-stack{" "}
    //             <span style={{ fontFamily: "monospace" }}>MERN</span> app 👏
    //           </p>
    //         </h4>
    //         <button
    //           style={{
    //             width: "150px",
    //             borderRadius: "3px",
    //             letterSpacing: "1.5px",
    //             marginTop: "1rem"
    //           }}
    //           onClick={this.onLogoutClick}
    //           className="btn btn-large waves-effect waves-light hoverable blue accent-3"
    //         >
    //           Logout
    //         </button>
    //       </div>
    //     </div>
    //   </div>
    // );
  }
}

Dashboard.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  getAccounts: PropTypes.func.isRequired,
  addAccount: PropTypes.func.isRequired,
  plaid: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  plaid: state.plaid
});

export default connect(
  mapStateToProps,
  { logoutUser, getAccounts, addAccount }
)(Dashboard);
