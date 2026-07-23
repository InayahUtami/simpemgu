"use client";

import UserMasterDataTable from "../components/UserMasterDataTable";

export default function DataGuruUserPage() {
	return (
		<UserMasterDataTable
			title="Data Guru"
			description="Data guru per kecamatan berdasarkan data yang sama dengan halaman admin."
			endpoint="/api/data/guru-per-kecamatan"
			valueKey="total_guru"
			valueLabel="Total Guru"
		/>
	);
}
