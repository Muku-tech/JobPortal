import { useParams } from "react-router-dom";
import EmployerApplications from "./EmployerApplications";

function EmployerApplicationsWrapper() {
  const { jobId } = useParams();

  return <EmployerApplications jobId={jobId} />;
}

export default EmployerApplicationsWrapper;