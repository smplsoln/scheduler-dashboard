import React, { Component } from "react";
import axios from "axios";
import classnames from "classnames";

import Loading from "./Loading";
import Panel from "./Panel";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";

 import { setInterview } from "helpers/reducers";

 const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
   };

  selectPanel(id) {
    console.log("Dashboard.selectPanel: ", id);
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
    console.log("Dashboard.selectPanel: this.state: ", this.state);
  }

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    console.log("Dashboard.componentDidMount: ", localStorage);

    if (focused) {
      console.log("Dashboard.componentDidMount: setState: {focused = ", focused, " }");
      this.setState({ focused });
    }

    console.log("Dashboard.componentDidMount: axios GET days, appointments, interviewers: ");
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    console.log("Dashboard.componentDidMount: this.state: ", this.state);

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    console.log("Dashboard.componentDidMount: set this.WebSocket:", this.socket , process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  componentWillUnmount() {
    this.socket.close();
  }

  componentDidUpdate(previousProps, previousState) {
    console.log("Dashboard.componentDidUpdate: previousState: ", previousState, " , this.state: ", this.state);
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
      console.log("Dashboard.componentDidUpdate: focused state changed so store in localStorage", localStorage);
    }
  }

  render() {
    console.log("Dashboard.render : ", this.state);
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    if (this.state.loading) {
      return <Loading />;
    }

    const panels = data
      .filter(
        panel => this.state.focused === null
                  || this.state.focused === panel.id
      )
      .map(panel => (
      <Panel
        key={panel.id}
        label={panel.label}
        value={panel.getValue(this.state)}
        onSelect={event => this.selectPanel(panel.id)}
      />
    ));

    return <main className={dashboardClasses}>
        {panels}
      </main>;
  }
}

export default Dashboard;
